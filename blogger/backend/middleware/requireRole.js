// Role-based authorization. Use after authMiddleware, which sets req.user from the JWT.
// Example: router.get('/admin/all', requireRole('admin'), handler)
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: you do not have permission for this action' });
  }
  next();
};

export default requireRole;
