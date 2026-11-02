// API tests: Node's built-in test runner + Supertest against a real MongoDB.
// Run with `npm test`. Uses MONGO_URI_TEST (default mongodb://127.0.0.1:27017/blogify_test).
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../app.js';
import User from '../models/User.js';
import Blog from '../models/Blog.js';
import AuditLog from '../models/AuditLog.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= 'test-secret';
process.env.JWT_EXPIRATION ||= '1h';
process.env.AUTH_RATE_LIMIT ||= '1000';

const MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/blogify_test';
const dbName = new URL(MONGO_URI).pathname.slice(1);
if (!dbName.endsWith('_test')) {
  throw new Error(`Refusing to run tests against "${dbName}": the database name must end in _test`);
}

let app;
const PASSWORD = 'password123';

// Signs up (if needed) and logs in; returns an agent that keeps the auth cookie
const loginAs = async (email, name) => {
  await request(app).post('/api/auth/signup').send({ email, password: PASSWORD, name });
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  assert.equal(res.status, 200, `login failed for ${email}`);
  return agent;
};

const publish = (agent, body) => agent.post('/api/blogs/publish').send(body);

before(async () => {
  await mongoose.connect(MONGO_URI);
  await mongoose.connection.dropDatabase();
  await Promise.all([User.syncIndexes(), Blog.syncIndexes(), AuditLog.syncIndexes()]);
  app = createApp();
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('health and routing', () => {
  test('health check reports the database as up', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.database, 'up');
  });

  test('unknown API routes return JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    assert.equal(res.status, 404);
    assert.match(res.body.message, /Route not found/);
  });

  test('security headers are set by helmet', async () => {
    const res = await request(app).get('/api/health');
    assert.match(res.headers['content-security-policy'], /script-src 'self'/);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
  });
});

describe('signup and login', () => {
  test('rejects an invalid email and a short password with field errors', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'not-an-email', password: '123' });
    assert.equal(res.status, 400);
    const fields = res.body.errors.map((e) => e.field).sort();
    assert.deepEqual(fields, ['email', 'password']);
  });

  test('creates an account, stores a bcrypt hash, and rejects a duplicate with 409', async () => {
    const first = await request(app).post('/api/auth/signup').send({ email: 'Writer@Test.com', password: PASSWORD });
    assert.equal(first.status, 201);
    const user = await User.findOne({ email: 'writer@test.com' });
    assert.match(user.password, /^\$2[aby]\$10\$/); // bcrypt, cost 10
    assert.equal(user.name, 'writer'); // default name from the email

    const dup = await request(app).post('/api/auth/signup').send({ email: 'writer@test.com', password: PASSWORD });
    assert.equal(dup.status, 409);
  });

  test('wrong password and unknown email get the same generic 401', async () => {
    const wrongPw = await request(app).post('/api/auth/login').send({ email: 'writer@test.com', password: 'wrong-pass' });
    const noUser = await request(app).post('/api/auth/login').send({ email: 'ghost@test.com', password: 'wrong-pass' });
    assert.equal(wrongPw.status, 401);
    assert.equal(noUser.status, 401);
    assert.equal(wrongPw.body.message, noUser.body.message);
    assert.ok(await AuditLog.exists({ action: 'auth.login_failed', actorEmail: 'ghost@test.com' }));
  });

  test('blocks NoSQL injection in the login body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    assert.equal(res.status, 400);
  });

  test('login sets an httpOnly, SameSite=Lax cookie and /me returns the user', async () => {
    const agent = request.agent(app);
    const res = await agent.post('/api/auth/login').send({ email: 'writer@test.com', password: PASSWORD });
    assert.equal(res.status, 200);
    const cookie = res.headers['set-cookie'].join(';');
    assert.match(cookie, /token=/);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    const me = await agent.get('/api/auth/me');
    assert.equal(me.body.user.email, 'writer@test.com');
    assert.equal(me.body.user.role, 'author');
  });

  test('/me answers { user: null } for visitors instead of an error', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 200);
    assert.equal(res.body.user, null);
  });

  test('protected routes return 401 without a cookie', async () => {
    const res = await request(app).get('/api/blogs');
    assert.equal(res.status, 401);
  });

  test('rate limiting returns 429 after too many failed logins', async () => {
    const limited = createApp({ authRateLimit: 3 });
    for (let i = 0; i < 3; i++) {
      const res = await request(limited).post('/api/auth/login').send({ email: 'writer@test.com', password: 'nope' });
      assert.equal(res.status, 401);
    }
    const blocked = await request(limited).post('/api/auth/login').send({ email: 'writer@test.com', password: 'nope' });
    assert.equal(blocked.status, 429);
  });

  test('blocks state-changing requests from another website (CSRF)', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Origin', 'https://evil.example');
    assert.equal(res.status, 403);
  });
});

describe('writing, sanitizing and publishing', () => {
  let alice;
  before(async () => {
    alice = await loginAs('alice@test.com', 'Alice');
  });

  test('strips scripts, event handlers and javascript: links from content', async () => {
    const res = await alice.post('/api/blogs/save-draft').send({
      title: 'XSS attempt',
      content: '<p>Hello<script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)">link</a></p>',
    });
    assert.equal(res.status, 200);
    assert.doesNotMatch(res.body.content, /script|onerror|javascript:/i);
    assert.equal(res.body.status, 'draft');
    assert.equal(res.body.plainText, undefined); // internal search field is never returned
  });

  test('refuses to publish an empty post', async () => {
    const res = await publish(alice, { title: 'Empty', content: '<p><br></p>' });
    assert.equal(res.status, 400);
  });

  test('publishing sets a slug, excerpt, reading time and normalised tags', async () => {
    const res = await publish(alice, {
      title: 'Learning React Hooks',
      content: `<p>${'useEffect and useRef explained. '.repeat(80)}</p>`,
      tags: 'React, #Web Dev, react',
    });
    assert.equal(res.status, 200);
    assert.match(res.body.slug, /^learning-react-hooks-[a-f0-9]{6}$/);
    assert.ok(res.body.publishedAt);
    assert.equal(res.body.readingTime, 2); // 400 words at 200 wpm
    assert.ok(res.body.excerpt.length <= 181);
    assert.deepEqual(res.body.tags, ['react', 'web-dev']);
  });

  test('unpublishing and republishing keeps the same slug', async () => {
    const created = await publish(alice, { title: 'Stable link', content: '<p>Body</p>' });
    const draft = await alice.post('/api/blogs/save-draft').send({ _id: created.body._id, title: 'Stable link v2', content: '<p>Body</p>' });
    assert.equal(draft.body.status, 'draft');
    const again = await publish(alice, { _id: created.body._id, title: 'Stable link v2', content: '<p>Body</p>' });
    assert.equal(again.body.slug, created.body.slug);
  });

  test('author stats are computed with an aggregation', async () => {
    const res = await alice.get('/api/blogs/stats');
    assert.equal(res.status, 200);
    assert.equal(res.body.drafts, 1);
    assert.equal(res.body.published, 2);
  });
});

describe('ownership: authors only touch their own posts', () => {
  let alice;
  let bob;
  let postId;
  before(async () => {
    alice = await loginAs('alice@test.com', 'Alice');
    bob = await loginAs('bob@test.com', 'Bob');
    const res = await alice.post('/api/blogs/save-draft').send({ title: 'Private draft', content: '<p>Secret</p>' });
    postId = res.body._id;
  });

  test("another author gets 404 on read, edit, publish and delete", async () => {
    assert.equal((await bob.get(`/api/blogs/${postId}`)).status, 404);
    assert.equal((await bob.post('/api/blogs/save-draft').send({ _id: postId, title: 'Hacked', content: '<p>x</p>' })).status, 404);
    assert.equal((await publish(bob, { _id: postId, title: 'Hacked', content: '<p>x</p>' })).status, 404);
    assert.equal((await bob.delete(`/api/blogs/${postId}`)).status, 404);
    const stillThere = await Blog.findById(postId);
    assert.equal(stillThere.title, 'Private draft');
  });

  test("another author's list doesn't include it", async () => {
    const res = await bob.get('/api/blogs');
    assert.equal(res.body.length, 0);
  });

  test('a malformed id returns 400', async () => {
    assert.equal((await alice.get('/api/blogs/not-an-id')).status, 400);
  });
});

describe('public feed, search and post pages', () => {
  let carol;
  before(async () => {
    carol = await loginAs('carol@test.com', 'Carol');
    await publish(carol, { title: 'MongoDB indexing guide', content: '<p>Compound indexes and covered queries.</p>', tags: 'mongodb' });
    await publish(carol, { title: 'Express middleware patterns', content: '<p>Authentication and error handling.</p>', tags: 'node' });
    await carol.post('/api/blogs/save-draft').send({ title: 'Unfinished MongoDB draft', content: '<p>Not public</p>' });
  });

  test('lists only published posts, by author name, without emails', async () => {
    const res = await request(app).get('/api/public/blogs?limit=50');
    assert.equal(res.status, 200);
    assert.ok(res.body.items.every((b) => b.title !== 'Unfinished MongoDB draft'));
    assert.ok(res.body.items.some((b) => b.author.name === 'Carol'));
    assert.doesNotMatch(JSON.stringify(res.body), /@test\.com/);
  });

  test('full-text search finds posts by words in the title or body', async () => {
    const res = await request(app).get('/api/public/blogs?q=indexes');
    assert.deepEqual(res.body.items.map((b) => b.title), ['MongoDB indexing guide']);
  });

  test('filters by tag', async () => {
    const res = await request(app).get('/api/public/blogs?tag=node');
    assert.deepEqual(res.body.items.map((b) => b.title), ['Express middleware patterns']);
  });

  test('cursor pagination returns every post exactly once', async () => {
    const seen = [];
    let cursor = null;
    do {
      const res = await request(app).get(`/api/public/blogs?limit=2${cursor ? `&cursor=${cursor}` : ''}`);
      assert.equal(res.status, 200);
      seen.push(...res.body.items.map((b) => b._id));
      cursor = res.body.nextCursor;
    } while (cursor);
    const total = await Blog.countDocuments({ status: 'published' });
    assert.equal(seen.length, total);
    assert.equal(new Set(seen).size, total);
  });

  test('rejects a tampered cursor', async () => {
    assert.equal((await request(app).get('/api/public/blogs?cursor=garbage')).status, 400);
  });

  test('a post page counts views atomically; drafts are not public', async () => {
    const post = await Blog.findOne({ title: 'MongoDB indexing guide' });
    await Promise.all([1, 2, 3].map(() => request(app).get(`/api/public/blogs/${post.slug}`)));
    const after = await Blog.findById(post._id);
    assert.equal(after.views, 3);

    const draft = await Blog.findOne({ title: 'Unfinished MongoDB draft' });
    assert.equal(draft.slug, undefined);
  });

  test('top tags come from an aggregation', async () => {
    const res = await request(app).get('/api/public/tags');
    assert.ok(res.body.some((t) => t.tag === 'mongodb' && t.count >= 1));
  });
});

describe('admin role, analytics and audit log', () => {
  let author;
  let admin;
  before(async () => {
    author = await loginAs('dave@test.com', 'Dave');
    await request(app).post('/api/auth/signup').send({ email: 'admin@test.com', password: PASSWORD, name: 'Admin' });
    await User.updateOne({ email: 'admin@test.com' }, { role: 'admin' });
    admin = await loginAs('admin@test.com', 'Admin');
  });

  test('authors get 403 on every admin route', async () => {
    for (const path of ['/api/admin/blogs', '/api/admin/stats', '/api/admin/audit']) {
      assert.equal((await author.get(path)).status, 403, path);
    }
  });

  test('admins see platform stats', async () => {
    const res = await admin.get('/api/admin/stats');
    assert.equal(res.status, 200);
    assert.ok(res.body.users.total >= 5);
    assert.equal(res.body.users.admins, 1);
    assert.ok(Array.isArray(res.body.topAuthors));
  });

  test('admin delete removes any post and is written to the audit log', async () => {
    const created = await publish(author, { title: 'Spam post', content: '<p>Buy now</p>' });
    const res = await admin.delete(`/api/admin/blogs/${created.body._id}`);
    assert.equal(res.status, 200);
    assert.equal(await Blog.exists({ _id: created.body._id }), null);

    // The audit write is fire-and-forget, so give it a moment
    await new Promise((r) => setTimeout(r, 100));
    const audit = await admin.get('/api/admin/audit');
    const entry = audit.body.find((e) => e.action === 'admin.blog_delete');
    assert.ok(entry);
    assert.equal(entry.actorEmail, 'admin@test.com');
    assert.equal(entry.details.title, 'Spam post');
  });
});
