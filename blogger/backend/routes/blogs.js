import express from 'express';
import mongoose from 'mongoose';
import Blog from '../models/Blog.js';
import authMiddleware from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

// Every blog route requires a logged-in user
router.use(authMiddleware);

// Reject malformed ids before they reach the database
router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid blog id' });
  }
  next();
});

// Create a post owned by the logged-in user, or update one they already own.
// Returns null when the post doesn't exist OR belongs to someone else.
const upsertOwnBlog = async (req, status) => {
  const { _id, title, content, tags } = req.body;
  if (_id) {
    if (!mongoose.isValidObjectId(_id)) return null;
    return Blog.findOneAndUpdate(
      { _id, author: req.user.id }, // ownership is enforced inside the query
      { title, content, tags, status, updated_at: Date.now() },
      { new: true }
    );
  }
  return Blog.create({ title, content, tags, status, author: req.user.id });
};

// ---------- Admin-only moderation routes ----------

// Every post from every author, with the author's email
router.get('/admin/all', requireRole('admin'), async (req, res) => {
  try {
    const blogs = await Blog.find().populate('author', 'email role').sort({ updated_at: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove any post, whoever wrote it
router.delete('/admin/:id', requireRole('admin'), async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json({ message: 'Blog deleted by admin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- Author routes: only your own posts ----------

// Your posts, newest first
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id }).sort({ updated_at: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save or update a draft
router.post('/save-draft', async (req, res) => {
  try {
    const blog = await upsertOwnBlog(req, 'draft');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Publish a post (update if it exists, else create)
router.post('/publish', async (req, res) => {
  try {
    const blog = await upsertOwnBlog(req, 'published');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// One of your posts by id. Someone else's post returns 404, so ids can't be probed.
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, author: req.user.id });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete one of your posts
router.delete('/:id', async (req, res) => {
  try {
    const blog = await Blog.findOneAndDelete({ _id: req.params.id, author: req.user.id });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
