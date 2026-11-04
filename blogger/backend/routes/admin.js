import express from 'express';
import mongoose from 'mongoose';
import Blog from '../models/Blog.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import authMiddleware from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import { audit } from '../utils/audit.js';

// Every route in this router requires a logged-in admin (401 if not logged in, 403 if not admin)
const router = express.Router();
router.use(authMiddleware, requireRole('admin'));

router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid blog id' });
  next();
});

// All posts from all authors, with the author's email (admins only)
router.get('/blogs', async (req, res) => {
  const blogs = await Blog.find()
    .select('-content')
    .populate('author', 'email name role')
    .sort({ updated_at: -1 });
  res.json(blogs);
});

// Remove any post (moderation). Recorded in the audit log.
router.delete('/blogs/:id', async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) return res.status(404).json({ message: 'Blog not found' });
  audit(req, 'admin.blog_delete', {
    target: blog._id,
    details: { title: blog.title, author: String(blog.author) },
  });
  res.json({ message: 'Blog deleted by admin' });
});

// Platform analytics, computed in MongoDB with aggregation pipelines
router.get('/stats', async (req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [usersByRole, postsByStatus, topAuthors, publishedThisWeek] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Blog.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, views: { $sum: '$views' } } }]),
    Blog.aggregate([
      {
        $group: {
          _id: '$author',
          posts: { $sum: 1 },
          published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
          views: { $sum: '$views' },
        },
      },
      { $sort: { views: -1, posts: -1 } },
      { $limit: 5 },
      // $lookup is MongoDB's join: attach each author's user document
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 0, name: '$user.name', email: '$user.email', posts: 1, published: 1, views: 1 } },
    ]),
    Blog.countDocuments({ status: 'published', publishedAt: { $gte: since } }),
  ]);

  const count = (rows, key) => rows.find((r) => r._id === key)?.count ?? 0;
  res.json({
    users: { total: usersByRole.reduce((s, r) => s + r.count, 0), admins: count(usersByRole, 'admin') },
    posts: { drafts: count(postsByStatus, 'draft'), published: count(postsByStatus, 'published') },
    totalViews: postsByStatus.reduce((s, r) => s + r.views, 0),
    publishedThisWeek,
    topAuthors,
  });
});

// Latest audit events, newest first
router.get('/audit', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const events = await AuditLog.find().sort({ at: -1 }).limit(limit);
  res.json(events);
});

export default router;
