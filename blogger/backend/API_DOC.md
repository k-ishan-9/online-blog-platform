# Blogify Backend API Documentation

This document describes the API endpoints, services, and models used in the Blogify backend.

---

## Models

### User

- **email**: String, required, unique
- **password**: String, required

### Blog

- **title**: String, required
- **content**: String, required
- **tags**: String (comma-separated)
- **status**: String, either `'draft'` or `'published'`
- **created_at**: Date
- **updated_at**: Date

---

## Authentication Routes (`/api/auth`)

### POST `/signup`
- **Description:** Register a new user.
- **Body:** `{ email, password }`
- **Response:** Success or error message.

### POST `/login`
- **Description:** Log in a user and set a JWT cookie.
- **Body:** `{ email, password }`
- **Response:** Success or error message.

### GET `/me`
- **Description:** Get the current logged-in user's info.
- **Headers:** Requires valid JWT cookie.
- **Response:** `{ user }` or error.

### DELETE `/:id`
- **Description:** Delete a blog by ID.
- **Headers:** Requires authentication.
- **Response:** Success message or error.

### POST `/logout`
- **Description:** Log out the user (clears JWT cookie).
- **Response:** Success message.

---

## Blog Routes (`/api/blogs`)

### POST `/save-draft`
- **Description:** Save a new draft or update an existing one.
- **Body:** `{ _id?, title, content, tags }`
- **Headers:** Requires authentication.
- **Response:** The saved draft.

### POST `/publish`
- **Description:** Publish a blog post (new or update).
- **Body:** `{ _id?, title, content, tags }`
- **Headers:** Requires authentication.
- **Response:** The published blog.

### GET `/`
- **Description:** Get all blogs for the user.
- **Headers:** Requires authentication.
- **Response:** Array of blogs.

### GET `/:id`
- **Description:** Get a single blog by ID.
- **Headers:** Requires authentication.
- **Response:** Blog object.

---

## Middleware

### `authMiddleware`
- Checks for a valid JWT in cookies.
- Adds user info to `req.user` if valid.
- Returns 401 if not authenticated.

---

## Services

- **Database:** MongoDB via Mongoose.
- **Authentication:** JWT in HTTP-only cookies.
- **Password Hashing:** bcrypt.