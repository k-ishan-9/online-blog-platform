import express from 'express';
import mongoose from 'mongoose';
import Blog from '../models/Blog.js';
import authMiddleware from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError } from '../middleware/errorHandler.js';
import { blogInputSchema } from '../validation/schemas.js';
import { buildContentFields, makeSlug } from '../utils/content.js';
import { audit } from '../utils/audit.js';

// Author routes: every query is scoped to the logged-in user, so another author's post
// simply doesn't exist from your point of view (404, never 403, so ids can't be probed).
const router = express.Router();

router.use(authMiddleware);

router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid blog id' });
  next();
});

// Create a post owned by the user, or update one they own. Returns null if not theirs.
const saveOwnBlog = async (req, status) => {
  const { _id, title, content, tags } = req.body;
  const fields = buildContentFields({ title, content, tags });
  if (status === 'published' && !fields.plainText) {
    throw new HttpError(400, 'Write something before publishing');
  }

  let blog;
  if (_id) {
    blog = await Blog.findOne({ _id, author: req.user.id });
    if (!blog) return null;
    blog.set(fields);
  } else {
    blog = new Blog({ ...fields, author: req.user.id });
  }
  blog.status = status;

  const firstPublish = status === 'published' && !blog.publishedAt;
  if (firstPublish) {
    blog.publishedAt = new Date();
    blog.slug = makeSlug(blog.title);
  }
  await blog.save();
  if (firstPublish) audit(req, 'blog.publish', { target: blog._id, details: { slug: blog.slug } });
  return blog;
};

// Your posts, newest first. Content is left out: the list doesn't need it (smaller payload).
router.get('/', async (req, res) => {
  const blogs = await Blog.find({ author: req.user.id }).select('-content').sort({ updated_at: -1 });
  res.json(blogs);
});

// Your dashboard numbers, computed in MongoDB with an aggregation pipeline
router.get('/stats', async (req, res) => {
  const rows = await Blog.aggregate([
    // aggregate() skips Mongoose casting, so the id string must become an ObjectId here
    { $match: { author: new mongoose.Types.ObjectId(String(req.user.id)) } },
    { $group: { _id: '$status', posts: { $sum: 1 }, views: { $sum: '$views' } } },
  ]);
  const byStatus = Object.fromEntries(rows.map((r) => [r._id, r]));
  res.json({
    drafts: byStatus.draft?.posts ?? 0,
    published: byStatus.published?.posts ?? 0,
    totalViews: rows.reduce((sum, r) => sum + r.views, 0),
  });
});

// Save (or unpublish to) a draft
router.post('/save-draft', validate(blogInputSchema), async (req, res) => {
  const blog = await saveOwnBlog(req, 'draft');
  if (!blog) return res.status(404).json({ message: 'Blog not found' });
  res.json(blog);
});

// Publish, or update an already published post. The slug is kept from the first publish.
router.post('/publish', validate(blogInputSchema), async (req, res) => {
  const blog = await saveOwnBlog(req, 'published');
  if (!blog) return res.status(404).json({ message: 'Blog not found' });
  res.json(blog);
});

router.get('/:id', async (req, res) => {
  const blog = await Blog.findOne({ _id: req.params.id, author: req.user.id });
  if (!blog) return res.status(404).json({ message: 'Blog not found' });
  res.json(blog);
});

router.delete('/:id', async (req, res) => {
  const blog = await Blog.findOneAndDelete({ _id: req.params.id, author: req.user.id });
  if (!blog) return res.status(404).json({ message: 'Blog not found' });
  res.json({ message: 'Blog deleted' });
});

export default router;
