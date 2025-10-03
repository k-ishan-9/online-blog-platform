import { getBlog, deleteBlog } from '../services/api';

function BlogList({ blogs, setView, fetchBlogs, setEditBlog, setShowBlog }) {
    const handleEdit = async (id) => {
        try {
            const blog = await getBlog(id);
            setEditBlog(blog);
            setView('editor');
        } catch (error) {
            // Optionally show notification
        }
    };

    const handleShow = async (id) => {
        try {
            const blog = await getBlog(id);
            setShowBlog(blog);
        } catch (error) {
            // Optionally show notification
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this blog?')) return;
        try {
            await deleteBlog(id);
            fetchBlogs();
        } catch (error) {
            // Optionally show notification
        }
    };    

    return (
        <div className="min-w-[70vw] max-w-[80vw] mx-auto mt-10 p-8 bg-gradient-to-br from-white via-blue-[#eff6ee] to-blue-50 rounded-2xl shadow-2xl border border-blue-200">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-extrabold text-blue-700 drop-shadow">📝 Your Blogs</h2>
                <button
                    onClick={() => { setEditBlog(null); setView('editor'); }}
                    className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-800 transition"
                >
                    + New Blog
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-2xl font-semibold mb-4 text-gray-700">Drafts</h3>
                    {blogs.drafts.length === 0 && <p className="text-gray-400">No drafts yet.</p>}
                    {blogs.drafts.map(blog => (
                        <div key={blog._id} className="p-4 mb-4 bg-white border-l-4 border-yellow-400 rounded-lg shadow hover:shadow-lg transition">
                            <h4 className="font-bold text-lg mb-2">{blog.title}</h4>
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-xs text-gray-400">Last updated: {new Date(blog.updated_at).toLocaleString()}</span>
                                <button
                                    onClick={() => handleEdit(blog._id)}
                                    className="text-yellow-600 font-semibold hover:underline"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(blog._id)}
                                    className="ml-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div>
                    <h3 className="text-2xl font-semibold mb-4 text-gray-700">Published</h3>
                    {blogs.published.length === 0 && <p className="text-gray-400">No published blogs yet.</p>}
                    {blogs.published.map(blog => (
                        <div key={blog._id} className="p-4 mb-4 bg-white border-l-4 border-green-400 rounded-lg shadow hover:shadow-lg transition">
                            <h4 className="font-bold text-lg mb-2">{blog.title}</h4>
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-xs text-gray-400">Published: {new Date(blog.updated_at).toLocaleString()}</span>
                                <button
                                    onClick={() => handleEdit(blog._id)}
                                    className="text-green-600 font-semibold hover:underline"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleShow(blog._id)}
                                    className="ml-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                                >
                                    Show
                                </button>
                                <button
                                    onClick={() => handleDelete(blog._id)}
                                    className="ml-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default BlogList;