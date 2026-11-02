import axios from 'axios';
import { tagsToText } from '../utils/format';

// Relative base URL: Express serves the app in production, and Vite proxies /api in development.
// withCredentials sends the httpOnly JWT cookie with every request.
const api = axios.create({ baseURL: '/api', withCredentials: true });

const data = (request) => request.then((response) => response.data);

// ---------- Auth ----------

// The logged-in user ({ id, email, name, role }) or null if there is no valid session
export const getCurrentUser = async () => {
    try {
        return (await api.get('/auth/me')).data.user;
    } catch {
        return null;
    }
};
export const login = (credentials) => data(api.post('/auth/login', credentials));
export const signup = (details) => data(api.post('/auth/signup', details));
export const logout = () => data(api.post('/auth/logout'));

// ---------- Author (your own posts) ----------

// Only the fields the API accepts; _id only when the post already exists
const toPayload = (blog) => ({
    ...(blog._id ? { _id: blog._id } : {}),
    title: blog.title,
    content: blog.content,
    tags: tagsToText(blog.tags),
});

export const saveDraft = (blog) => data(api.post('/blogs/save-draft', toPayload(blog)));
export const publishBlog = (blog) => data(api.post('/blogs/publish', toPayload(blog)));
export const getMyBlogs = () => data(api.get('/blogs'));
export const getMyStats = () => data(api.get('/blogs/stats'));
export const getBlog = (id) => data(api.get(`/blogs/${id}`));
export const deleteBlog = (id) => data(api.delete(`/blogs/${id}`));

// ---------- Public (no login needed) ----------

export const getFeed = (params) => data(api.get('/public/blogs', { params }));
export const getTopTags = () => data(api.get('/public/tags'));
export const getPublicPost = (slug) => data(api.get(`/public/blogs/${encodeURIComponent(slug)}`));

// ---------- Admin (the server answers 403 for any other role) ----------

export const getAllBlogsAdmin = () => data(api.get('/admin/blogs'));
export const adminDeleteBlog = (id) => data(api.delete(`/admin/blogs/${id}`));
export const getAdminStats = () => data(api.get('/admin/stats'));
export const getAuditLog = () => data(api.get('/admin/audit'));
