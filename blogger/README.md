# Blogify

Blogify is a full-stack, multi-author blog editor built with the MERN stack and styled with Tailwind CSS. Authors write, auto-save, publish, edit and delete their own posts. Admins can moderate every post. Access is secured with JWT authentication and role-based authorization.

**Author:** Kishan Achanta ([GitHub](https://github.com/k-ishan-9))

---

## Tech Stack

- **Frontend:** React (Vite), React-Quill, Axios, Tailwind CSS
- **Backend:** Node.js, Express 5, MongoDB, Mongoose
- **Security:** JWT in httpOnly cookies, bcrypt password hashing, role-based access control

---

## Features

- **Rich blog editor:** title, rich-text content and comma-separated tags.
- **Drafts and publishing:** save work as a draft or publish when ready.
- **Auto-save with debouncing:** saves 5 seconds after you stop typing, plus a 30-second safety net while there are unsaved changes.
- **Multi-author ownership:** every post belongs to its author. Authors only ever see and change their own posts.
- **Role-based access:** `author` and `admin` roles. Admins get an Admin Panel to view and remove any post.
- **Blog management:** view, edit and delete drafts and published posts.
- **Notifications:** instant feedback on auto-save, save and publish.
- **Responsive UI** built with Tailwind CSS.

---

## Access Control

| Action | Author | Admin |
| --- | --- | --- |
| Create, edit, publish, delete **own** posts | Yes | Yes |
| Read or change **another author's** post through the normal routes | No (404) | No (404) |
| See every post with its author (Admin Panel) | No (403) | Yes |
| Delete any post (moderation) | No (403) | Yes |

How it's enforced on the server:

- **Authentication:** `authMiddleware` verifies the JWT from the httpOnly cookie and sets `req.user = { id, email, role }`. No valid token means 401.
- **Ownership:** every author query filters on `author: req.user.id`, for example `Blog.findOneAndDelete({ _id, author: req.user.id })`. Another author's post returns 404, so post ids can't be probed.
- **Roles:** the `requireRole('admin')` middleware guards `/api/blogs/admin/*` and returns 403 for any other role.

The UI hides the Admin Panel button from authors, but the server is the real gatekeeper.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (LTS recommended)
- A MongoDB connection string: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, or a local MongoDB server (`mongodb://127.0.0.1:27017/blogify`)

### 1. Clone the repository

```bash
git clone https://github.com/k-ishan-9/online-blog-platform.git
cd online-blog-platform/blogger
```

### 2. Create a `.env` file in the `blogger/` folder (next to `package.json`)

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_string
JWT_EXPIRATION=1h
PORT=5000
```

### 3. Run it

**Option A: single server (simplest)**

```bash
npm run build     # installs backend + frontend packages and builds the React app
npm start         # Express serves the API and the built frontend
```

Open http://localhost:5000

**Option B: development mode with hot reload (two terminals)**

```bash
# terminal 1, in blogger/
npm install
npm run dev

# terminal 2
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite forwards `/api` requests to the Express server on port 5000.

### 4. Make an admin (optional)

Sign up in the app first, then run:

```bash
npm run make-admin -- you@example.com
```

Log out and log back in so the new role is included in your token.

> Upgrading an older database? Posts created before ownership was added have no author, so they appear only in the Admin Panel.

---

## Usage

1. **Sign up and log in.**
2. **Write:** add a title, content and tags. Drafts auto-save as you type.
3. **Publish** when ready.
4. **View Blogs:** see your drafts and published posts, then edit, view or delete them.
5. **Admins:** open **Admin Panel** to see every author's posts and remove any of them.

---

## Project Structure

```
blogger/
  package.json          backend scripts (start, dev, build, make-admin)
  .env                  your local settings (not committed)
  backend/
    server.js           Express app; serves the API and frontend/dist
    config/db.js        MongoDB connection
    models/             User (email, password hash, role), Blog (author, status, ...)
    middleware/         auth.js (JWT check), requireRole.js (role check)
    routes/             auth.js, blogs.js
    scripts/            makeAdmin.js
    API_DOC.md
  frontend/
    vite.config.js      dev proxy for /api
    src/
      components/       BlogEditor, BlogList, DisplayBlog, AdminPanel, Login, Signup, Notification
      hooks/            useDebounce.js
      services/api.js   Axios calls
    DOC.md
```

---

## Documentation

- **Backend API:** `backend/API_DOC.md`
- **Frontend:** `frontend/DOC.md`
