import express from 'express';
import mongoose from 'mongoose';
import Blog from '../models/Blog.js';
import { validate } from '../middleware/validate.js';
import { feedQuerySchema } from '../validation/schemas.js';

// Public, read-only routes: published posts only. Authors are shown by name; emails are never exposed.
const router = express.Router();

const FEED_FIELDS = 'title slug excerpt tags readingTime views publishedAt author';

// The cursor is an opaque token holding the last item's (publishedAt, _id)
const encodeCursor = (blog) =>
  Buffer.from(JSON.stringify({ at: blog.publishedAt.toISOString(), id: String(blog._id) })).toString('base64url');

const decodeCursor = (cursor) => {
  try {
    const { at, id } = JSON.parse(Buffer.from(cursor, 'base64url').toString());
    const date = new Date(at);
    if (Number.isNaN(date.getTime()) || !mongoose.isValidObjectId(id)) return null;
    return { at: date, id: new mongoose.Types.ObjectId(String(id)) };
  } catch {
    return null;
  }
};

// GET /api/public/blogs?q=react&tag=webdev&limit=10&cursor=...
router.get('/blogs', validate(feedQuerySchema, 'query'), async (req, res) => {
  const { q, tag, cursor, limit } = req.validQuery;
  const filter = { status: 'published' };
  if (q) filter.$text = { $search: q }; // uses the weighted text index
  if (tag) filter.tags = tag;
  if (cursor) {
    const c = decodeCursor(cursor);
    if (!c) return res.status(400).json({ message: 'Invalid cursor' });
    // Cursor (keyset) pagination: everything strictly after the last item we sent
    filter.$or = [{ publishedAt: { $lt: c.at } }, { publishedAt: c.at, _id: { $lt: c.id } }];
  }

  const rows = await Blog.find(filter)
    .sort({ publishedAt: -1, _id: -1 })
    .limit(limit + 1) // one extra tells us whether another page exists
    .select(FEED_FIELDS)
    .populate('author', 'name');

  const items = rows.slice(0, limit);
  res.json({ items, nextCursor: rows.length > limit ? encodeCursor(items.at(-1)) : null });
});

// Most used tags on published posts
router.get('/tags', async (req, res) => {
  const tags = await Blog.aggregate([
    { $match: { status: 'published' } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 12 },
    { $project: { _id: 0, tag: '$_id', count: 1 } },
  ]);
  res.json(tags);
});

// One published post. The view count goes up atomically with $inc, so simultaneous
// readers never overwrite each other's increments.
router.get('/blogs/:slug', async (req, res) => {
  const blog = await Blog.findOneAndUpdate(
    { slug: req.params.slug, status: 'published' },
    { $inc: { views: 1 } },
    { new: true, timestamps: false } // a view is not an edit, so updated_at stays the same
  ).populate('author', 'name');
  if (!blog) return res.status(404).json({ message: 'Post not found' });
  res.json(blog);
});

export default router;
