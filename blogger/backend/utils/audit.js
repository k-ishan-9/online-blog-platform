import AuditLog from '../models/AuditLog.js';

// Records an audit event without slowing down or failing the user's request:
// if writing the log fails, the error is reported and the request carries on.
export const audit = (req, action, { target, details, actorEmail } = {}) =>
  AuditLog.create({
    action,
    actor: req?.user?.id,
    actorEmail: actorEmail ?? req?.user?.email,
    target: target != null ? String(target) : undefined,
    details,
    ip: req?.ip,
  }).catch((err) => console.error('Audit log write failed:', err.message));
