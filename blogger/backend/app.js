import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import blogRoutes from './routes/blogs.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import { requireSameOrigin } from './middleware/sameOrigin.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { allowedOrigins, httpsOnly } from './config/settings.js';

const distDir = fileURLToPath(new URL('../frontend/dist', import.meta.url));

// Builds the Express app without starting it, so tests can drive it with Supertest.
export const createApp = ({ authRateLimit } = {}) => {
  const app = express();

  // Behind a reverse proxy (Nginx, a cloud load balancer) use the real client IP for rate limits
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));

  // Security headers, including a Content-Security-Policy that only allows our own scripts
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // the Quill editor sets inline styles
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: httpsOnly() ? [] : null,
        },
      },
      // HSTS only makes sense when the site is served over HTTPS
      strictTransportSecurity: httpsOnly() ? { maxAge: 31536000, includeSubDomains: true } : false,
    })
  );

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  app.use(cors({ origin: allowedOrigins(), credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  // Health check for uptime monitors, Docker and load balancers
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'up' : 'down',
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  // Rate limits: a general one for the API, a strict one for login and signup
  app.use(
    '/api',
    rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false })
  );
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: authRateLimit ?? Number(process.env.AUTH_RATE_LIMIT || 10),
    skipSuccessfulRequests: true, // only failed attempts count, so real users are not locked out
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many attempts. Please try again in 15 minutes.' },
  });
  app.use(['/api/auth/login', '/api/auth/signup'], authLimiter);

  // CSRF defence in depth: reject state-changing requests sent from other websites
  app.use('/api', requireSameOrigin);

  app.use('/api/auth', authRoutes);
  app.use('/api/blogs', blogRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', notFound); // unknown API routes get JSON, not the React page

  // Serve the built React app; any non-API path returns index.html for client-side routing
  app.use(express.static(distDir));
  app.get(/^\/(?!api).*/, (req, res, next) => {
    res.sendFile('index.html', { root: distDir }, (err) => err && next(err));
  });

  app.use(errorHandler);
  return app;
};
