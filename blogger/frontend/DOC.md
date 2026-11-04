# Blogify Frontend

React 18 + Vite single-page app, styled with Tailwind CSS, routed with React Router.

## Routes

| Path | Page | Access |
| --- | --- | --- |
| `/` | `FeedPage`: public feed, debounced search, tag filters, Load more | Everyone |
| `/post/:slug` | `PostPage`: a published post, sanitized with DOMPurify | Everyone |
| `/login`, `/signup` | `LoginPage`, `SignupPage` | Visitors |
| `/dashboard` | `DashboardPage`: stats, your posts, the editor (`?edit=<id>` opens a post) | Logged in |
| `/admin` | `AdminPage`: overview, all posts, audit log | Admins |
| `*` | `NotFoundPage` | Everyone |

`DashboardPage` and `AdminPage` are lazy-loaded (`React.lazy`), so the rich-text editor's bundle is only downloaded by writers.

## State and data

- **`AuthProvider` / `useAuth()`**: one source of truth for the logged-in user (`GET /api/auth/me`), plus `refresh()` and `logout()`.
- **`ProtectedRoute`**: redirects visitors to `/login`, then returns them to the page they wanted. Shows a 403 message for the wrong role. The server enforces the same rules.
- **`services/api.js`**: every HTTP call in one place; Axios with `withCredentials` for the cookie.
- **`hooks/useDebounce.js`**: debounced callbacks with `.cancel()`, used by editor auto-save and feed search.

## Editor behaviour (`BlogEditor.jsx`)

- Drafts auto-save 5 s after typing stops, with a 30 s safety net, only when there are unsaved changes.
- Live posts never auto-save: changes go public only with **Update post**. **Unpublish** turns the post back into a draft.
- Only the writer's own edits (`source === 'user'`) mark the post dirty, not Quill normalising loaded HTML.
- After a save the editor adopts only `_id`, `status` and `slug`, so text typed during the request isn't lost.

## Environment

No front-end env variables. The app calls the relative path `/api`. In production Express serves the build on the same origin; in development `vite.config.js` proxies `/api` to `http://localhost:5000`.
