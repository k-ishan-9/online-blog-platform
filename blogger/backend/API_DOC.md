# Blogify Backend API

All routes are under `/api` and return JSON. Authentication uses a JWT stored in an httpOnly cookie named `token`, set by `POST /api/auth/login`.

**Errors** always look like `{ "message": "..." }`. Validation errors add `"errors": [{ "field", "message" }]`.

| Status | Meaning |
| --- | --- |
| 400 | Invalid input (Zod or Mongoose validation, malformed id or cursor) |
| 401 | Not logged in, or the session expired |
| 403 | Logged in but not allowed (wrong role), or a cross-site request |
| 404 | Not found, or not yours |
| 409 | Conflict: email already registered, or the post changed during your save |
| 413 | Request body over 2 MB |
| 429 | Too many requests (rate limit) |

---

## Models

**User**: `name`, `email` (unique, lowercase), `password` (bcrypt hash, never returned), `role` (`author` or `admin`), timestamps.

**Blog**: `title` (max 150), `content` (sanitized HTML), `plainText` (search only, never returned), `excerpt`, `tags` (up to 5, lowercase), `status` (`draft` or `published`), `author` (ref User), `slug` (set at first publish, never changed), `publishedAt`, `readingTime` (minutes), `views`, `created_at`, `updated_at`. Optimistic concurrency is on.

Indexes: `{ author, updated_at }` for the dashboard, `{ status, publishedAt, _id }` for the feed, and a weighted text index on title (10), tags (5) and plainText (1).

**AuditLog**: `action`, `actor`, `actorEmail`, `target`, `details`, `ip`, `at`. Append-only.

---

## Health

`GET /api/health` returns `{ status, database: "up" | "down", uptimeSeconds }`.

## Auth: `/api/auth`

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/signup` | `{ name?, email, password }` | 201. Password 8–72 characters. 409 if the email exists. Rate limited. |
| POST | `/login` | `{ email, password }` | Sets the cookie. 401 "Invalid email or password" for either mistake. Rate limited. |
| GET | `/me` | none | `{ user: { id, email, name, role } }` or `{ user: null }` |
| POST | `/logout` | none | Clears the cookie |

## Public: `/api/public` (no login)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/blogs?q=&tag=&cursor=&limit=` | Published posts, newest first. `q`: full-text search. `limit`: 1–50, default 10. Returns `{ items, nextCursor }`, where `nextCursor` is null on the last page. Authors appear by name only. |
| GET | `/blogs/:slug` | One published post. Increments `views` atomically. 404 for drafts and unknown slugs. |
| GET | `/tags` | Top 12 tags on published posts: `[{ tag, count }]` |

## Author: `/api/blogs` (login required, your posts only)

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| GET | `/` | none | Your posts, newest first, without `content` |
| GET | `/stats` | none | `{ drafts, published, totalViews }` |
| POST | `/save-draft` | `{ _id?, title, content, tags? }` | Creates or updates a draft. On a published post, unpublishes it (the slug is kept). |
| POST | `/publish` | `{ _id?, title, content, tags? }` | Publishes or updates a live post. First publish sets `slug` and `publishedAt`. 400 if the content is empty. |
| GET | `/:id` | none | 404 if it isn't yours |
| DELETE | `/:id` | none | 404 if it isn't yours |

`tags` accepts `"react, #Web Dev"` or `["react"]` and is normalised to `["react", "web-dev"]`.

## Admin: `/api/admin` (admin role required)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/blogs` | Every post with `author: { email, name, role }` |
| DELETE | `/blogs/:id` | Deletes any post; writes `admin.blog_delete` to the audit log |
| GET | `/stats` | `{ users: { total, admins }, posts: { drafts, published }, totalViews, publishedThisWeek, topAuthors }` |
| GET | `/audit?limit=` | Latest audit events (default 50, max 200) |

---

## Middleware order

`helmet` → `morgan` → `cors` → `express.json (2 MB)` → `cookie-parser` → rate limits → same-origin check → routers (`authMiddleware` → `requireRole` → `validate`) → 404 → error handler.

## Scripts

- `npm run make-admin -- <email>`: promotes a user to admin and records it in the audit log
- `npm run migrate`: upgrades posts saved by older versions; safe to re-run
- `npm test`: runs the API test suite against `MONGO_URI_TEST`
