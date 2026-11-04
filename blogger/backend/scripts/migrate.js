// One-off data migration for posts created before Blogify 2.0. Safe to run any number of times.
// Usage (from the blogger/ folder): npm run migrate
// - tags stored as "a, b" text become ['a', 'b']
// - posts get plainText, excerpt and readingTime
// - published posts get publishedAt and a slug, so they appear correctly in the public feed
import 'dotenv/config';
import mongoose from 'mongoose';
import Blog from '../models/Blog.js';
import { buildContentFields, makeSlug } from '../utils/content.js';
import { normalizeTags } from '../validation/schemas.js';

await mongoose.connect(process.env.MONGO_URI);

// Read raw documents: old ones don't match the new schema yet
const raw = await Blog.collection.find({}).toArray();
let updated = 0;

for (const doc of raw) {
  const set = {};
  const tags = normalizeTags(doc.tags ?? []);
  if (JSON.stringify(tags) !== JSON.stringify(doc.tags)) set.tags = tags;

  if (doc.plainText === undefined || doc.excerpt === undefined || doc.readingTime === undefined) {
    const fields = buildContentFields({ title: doc.title, content: doc.content || '', tags });
    Object.assign(set, {
      content: fields.content,
      plainText: fields.plainText,
      excerpt: fields.excerpt,
      readingTime: fields.readingTime,
    });
  }
  if (doc.views === undefined) set.views = 0;
  if (doc.status === 'published') {
    if (!doc.publishedAt) set.publishedAt = doc.updated_at || doc.created_at || new Date();
    if (!doc.slug) set.slug = makeSlug(doc.title || 'post');
  }

  if (Object.keys(set).length) {
    await Blog.collection.updateOne({ _id: doc._id }, { $set: set });
    updated += 1;
  }
}

await Blog.syncIndexes(); // create the new feed and text-search indexes
await mongoose.disconnect();
console.log(`Migration done: ${updated} of ${raw.length} posts updated.`);
