// Settings read from the environment, in one place.
// They are functions so tests can change process.env before the app is created.

export const isProduction = () => process.env.NODE_ENV === 'production';

// Secure cookies (sent only over HTTPS). On by default in production;
// COOKIE_SECURE=false lets you run a production build over plain http://localhost.
export const httpsOnly = () =>
  process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProduction();

// Front-end origins allowed to call the API from another port or domain (comma-separated).
export const allowedOrigins = () =>
  (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim());

export const authCookieOptions = () => ({
  httpOnly: true,       // page JavaScript can never read the token
  secure: httpsOnly(),  // only sent over HTTPS in production
  sameSite: 'lax',      // not sent on cross-site POSTs, which blocks classic CSRF
  path: '/',
});

export const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour, matches JWT_EXPIRATION=1h
