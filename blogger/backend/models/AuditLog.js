import mongoose from 'mongoose';

// Append-only record of security-relevant events: failed logins, signups, first publishes,
// admin deletions and role changes. The API offers no way to edit or delete entries.
const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g. 'auth.login_failed', 'admin.blog_delete'
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // empty for anonymous or CLI actions
    actorEmail: { type: String }, // kept even if the user is later removed
    target: { type: String }, // what was acted on: a post id, an email
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: { createdAt: 'at', updatedAt: false } }
);

auditLogSchema.index({ at: -1 });
auditLogSchema.index({ action: 1, at: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
