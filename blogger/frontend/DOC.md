# Blogify Frontend Documentation

This document describes the structure, main components, and API usage for the Blogify frontend.

---

## Project Structure

```
src/
  App.jsx
  components/
    BlogEditor.jsx
    BlogList.jsx
    Login.jsx
    Signup.jsx
    ShowBlog.jsx
    Notification.jsx
  hooks/
    useDebounce.js
  services/
    api.js
  styles/
    index.css
```

---

## Main Components

### `App.jsx`
- Root component.
- Handles authentication state, routing between login/signup/editor/blog list/show blog.
- Fetches blogs and manages logout.

### `Login.jsx`
- Login form.
- Calls `login` API and updates authentication state.

### `Signup.jsx`
- Signup form.
- Calls `signup` API and switches to login on success.

### `BlogEditor.jsx`
- Rich text editor for creating and editing blogs.
- Auto-saves drafts and allows publishing.
- Uses `saveDraft` and `publishBlog` APIs.

### `BlogList.jsx`
- Displays user's drafts and published blogs.
- Allows editing or viewing individual blogs.

### `ShowBlog.jsx`
- Shows a single blog post in detail.

### `Notification.jsx`
- Displays temporary notification messages.

---

## Hooks

### `useDebounce.js`
- Custom hook to debounce function calls (used for auto-save in editor).

---

## Services

### `api.js`
- Contains all API calls to the backend using Axios.
    - `login(credentials)`
    - `signup(credentials)`
    - `logout()`
    - `saveDraft(blogData)`
    - `publishBlog(blogData)`
    - `getBlogs()`
    - `getBlog(id)`
    - `deleteBlog(id)`

---

## Styling

- Uses [Tailwind CSS](https://tailwindcss.com/) for all UI styling.
- Main styles in `src/styles/index.css`.

---

## Environment Variables

- `.env` file contains `VITE_API_URL` for backend API base URL.

---

## Usage Flow

1. **User visits app:**  
   - If not logged in, sees Login or Signup form.
   - If logged in, sees Blog Editor or Blog List.

2. **Login/Signup:**  
   - Forms send credentials to backend via API.
   - On success, user is authenticated and can access blog features.

3. **Blog Management:**  
   - User can create, auto-save, publish, edit, view, and delete blogs.
   - Blogs are fetched and displayed in lists (drafts/published).

4. **Logout:**  
   - Clears authentication and returns to login screen.