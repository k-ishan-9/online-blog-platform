import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: { type: String },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  // Owner of the post: every read/update/delete is scoped to this user
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Serves "my posts, newest first" without scanning the whole collection
blogSchema.index({ author: 1, updated_at: -1 });

export default mongoose.model('Blog', blogSchema);
