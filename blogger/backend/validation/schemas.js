import { z } from 'zod';

// Turns "React, #webdev, Node JS" or ["React"] into ['react', 'webdev', 'node-js']: max 5 unique tags
export const normalizeTags = (input) => {
  const raw = Array.isArray(input) ? input : String(input ?? '').split(',');
  const tags = raw
    .map((t) => String(t).trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    .filter(Boolean)
    .map((t) => t.slice(0, 30));
  return [...new Set(tags)].slice(0, 5);
};

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50).optional(),
  email,
  // bcrypt only uses the first 72 bytes of a password, so longer ones are rejected rather than silently cut
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters'),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(200),
});

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const blogInputSchema = z.object({
  _id: objectId.optional(),
  title: z.string().trim().min(1, 'Title is required').max(150, 'Title must be at most 150 characters'),
  content: z.string().min(1, 'Content is required').max(500_000, 'Post is too long'),
  tags: z.union([z.string(), z.array(z.string())]).optional().transform(normalizeTags),
});

export const feedQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  tag: z.string().trim().toLowerCase().max(30).optional(),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
