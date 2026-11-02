# Blogify Backend API Documentation

This document describes the API endpoints, middleware and models used in the Blogify backend.

All routes are under `/api`. Authentication uses a JWT stored in an httpOnly cookie named `token`, set by `POST /api/auth/login`.

---

## Models

### User

- **email**: String, required, unique
- **password**: String, required (bcrypt hash)
- **role**: `'author'` (default) or `'admin'`

### Blog

- **title**: String, required
- **content**: String (HTML from the rich-text editor), required
- **tags**: String (comma-separated)
- **status**: `'draft'` or `'published'`
- **author**: ObjectId referencing `User`, required
- **created_at**, **updated_at**: Date

Index: `{ author: 1, updated_at: -1 }` serves "my posts, newest first".

---

## Authentication Routes (`/api/auth`)

### POST `/signup`
- **Body:** `{ email, password }`
- **Response:** `201` on success, `400` if the email is already registered.

### POST `/login`
- **Body:** `{ email, password }`
- **Response:** sets the `token` cookie (payload `{ id, email, role }`, signed with `JWT_SECRET`).

### GET `/me`
- **Auth:** required.
- **Response:** `{ user: { id, email, role } }`, or `401`.

### POST `/logout`
- **Response:** clears the `token` cookie.

---

## Blog Routes (`/api/blogs`)

Every blog route requires authentication (`401` without a valid token). Author routes only ever touch the logged-in user's own posts. Another author's post returns `404`. A malformed id returns `400`.

### GET `/`
- **Response:** your posts, newest first.

### POST `/save-draft`
- **Body:** `{ _id?, title, content, tags }`
- **Response:** the saved draft. Without `_id` a new post is created and owned by you. With `_id` your post is updated, or `404` if it isn't yours.

### POST `/publish`
- **Body:** `{ _id?, title, content, tags }`
- **Response:** the published post (same ownership rules as `save-draft`).

### GET `/:id`
- **Response:** one of your posts, or `404`.

### DELETE `/:id`
- **Response:** `{ message: 'Blog deleted' }`, or `404` if it isn't yours.

### Admin only

These return `403` for any role other than `admin`.

#### GET `/admin/all`
- **Response:** every post, newest first, with `author` populated as `{ _id, email, role }`.

#### DELETE `/admin/:id`
- **Response:** deletes any post (moderation), or `404`.

---

## Middleware

### `authMiddleware`
- Reads the `token` cookie and verifies it with `JWT_SECRET`.
- Sets `req.user = { id, email, role }`.
- Returns `401` if the token is missing or invalid.

### `requireRole(...roles)`
- Use after `authMiddleware`.
- Returns `403` unless `req.user.role` is one of `roles`.

---

## Scripts

- `npm run make-admin -- <email>`: promotes an existing user to `admin`. The user must log in again to get the new role in their token.

---

## Services

- **Database:** MongoDB via Mongoose.
- **Authentication:** JWT in httpOnly cookies.
- **Password hashing:** bcrypt (10 salt rounds).
