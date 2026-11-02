import { useEffect, useState } from 'react';
import { getAllBlogsAdmin, adminDeleteBlog } from '../services/api';

// Moderation view for admins: every author's posts. The server enforces the
// admin role (403 otherwise); hiding the button in the UI is only a convenience.
function AdminPanel({ setView }) {
    const [blogs, setBlogs] = useState([]);
    const [error, setError] = useState('');

    const loadAll = async () => {
        try {
            setBlogs(await getAllBlogsAdmin());
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load posts');
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this post for its author?')) return;
        try {
            await adminDeleteBlog(id);
            loadAll();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <div className="min-w-[70vw] max-w-[80vw] mx-auto mt-10 p-8 bg-white rounded-2xl shadow-2xl border border-purple-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-extrabold text-purple-700">Admin: all posts</h2>
                <button
                    onClick={() => setView('list')}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    My Blogs
                </button>
            </div>
            {error && <p className="mb-4 text-red-600">{error}</p>}
            {blogs.length === 0 && !error && <p className="text-gray-400">No posts yet.</p>}
            {blogs.length > 0 && (
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b text-gray-600">
                            <th className="py-2">Title</th>
                            <th className="py-2">Author</th>
                            <th className="py-2">Status</th>
                            <th className="py-2">Updated</th>
                            <th className="py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {blogs.map(blog => (
                            <tr key={blog._id} className="border-b">
                                <td className="py-2 font-semibold">{blog.title}</td>
                                <td className="py-2">{blog.author?.email || 'unknown'}</td>
                                <td className="py-2">{blog.status}</td>
                                <td className="py-2 text-sm text-gray-500">{new Date(blog.updated_at).toLocaleString()}</td>
                                <td className="py-2 text-right">
                                    <button
                                        onClick={() => handleDelete(blog._id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminPanel;
