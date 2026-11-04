import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    content: { type: String, required: true }, // sanitized HTML from the editor
    plainText: { type: String, default: '', select: false }, // for search only, never returned
    excerpt: { type: String, default: '' },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    // Owner of the post: every author read/update/delete is scoped to this user
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Set at first publish and never changed, so shared links keep working
    slug: { type: String, unique: true, sparse: true },
    publishedAt: { type: Date },
    readingTime: { type: Number, default: 1 },
    views: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    // Optimistic concurrency: a save fails with a VersionError (409) if another request
    // changed the post between our read and our write, instead of silently overwriting it
    optimisticConcurrency: true,
  }
);

// "My posts, newest first" (author dashboard)
blogSchema.index({ author: 1, updated_at: -1 });
// Public feed: published posts newest first, with _id as the tie-breaker for cursor paging
blogSchema.index({ status: 1, publishedAt: -1, _id: -1 });
// Full-text search, with a match in the title counting most
blogSchema.index(
  { title: 'text', tags: 'text', plainText: 'text' },
  { weights: { title: 10, tags: 5, plainText: 1 }, name: 'blog_text_search' }
);

blogSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.plainText;
    return ret;
  },
});

export default mongoose.model('Blog', blogSchema);
