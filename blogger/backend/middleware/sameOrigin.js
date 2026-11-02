import { allowedOrigins } from '../config/settings.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Browsers send an Origin header on POST/PUT/PATCH/DELETE. If it names a site other than
// this server or an allowed front end, the request came from another website: refuse it.
// This backs up the SameSite=Lax cookie against cross-site request forgery (CSRF).
export const requireSameOrigin = (req, res, next) => {
  const origin = req.get('origin');
  if (SAFE_METHODS.has(req.method) || !origin) return next();

  // Compare hosts only, so this still works behind an HTTPS-terminating proxy
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    originHost = null;
  }
  if (originHost === req.get('host') || allowedOrigins().includes(origin)) return next();

  return res.status(403).json({ message: 'Cross-site request blocked' });
};
