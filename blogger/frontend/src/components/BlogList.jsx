import { Link } from 'react-router-dom';
import { getBlog, deleteBlog } from '../services/api';
import { errorMessage, formatDateTime, plural } from '../utils/format';

// The author's own posts in two columns. The list endpoint leaves out post content,
// so Edit and Preview fetch the full post by id when needed.
function BlogList({ blogs, setView, fetchBlogs, setEditBlog, setShowBlog, onError }) {
    const handleEdit = async (id) => {
        try {
            setEditBlog(await getBlog(id));
            setView('editor');
        } catch (err) {
            onError(errorMessage(err));
        }
    };

    const handlePreview = async (id) => {
        try {
            setShowBlog(await getBlog(id));
        } catch (err) {
            onError(errorMessage(err));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await deleteBlog(id);
            fetchBlogs();
        } catch (err) {
            onError(errorMessage(err));
        }
    };

    const tagChips = (blog) =>
        blog.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
                {blog.tags.map((tag) => (
                    <span key={tag} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">#{tag}</span>
                ))}
            </div>
        );

    return (
        <div className="p-8 bg-white rounded-2xl shadow-2xl border border-blue-200">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-extrabold text-blue-700">Your posts</h2>
                <button
                    onClick={() => {
                        setEditBlog(null);
                        setView('editor');
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-800 transition"
                >
                    + New Post
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-2xl font-semibold mb-4 text-gray-700">Drafts</h3>
                    {blogs.drafts.length === 0 && <p className="text-gray-400">No drafts yet.</p>}
                    {blogs.drafts.map((blog) => (
                        <div key={blog._id} className="p-4 mb-4 bg-white border-l-4 border-yellow-400 rounded-lg shadow hover:shadow-lg transition">
                            <h4 className="font-bold text-lg mb-1">{blog.title}</h4>
                            {tagChips(blog)}
                            <p className="text-xs text-gray-400 mb-2">Last saved {formatDateTime(blog.updated_at)}</p>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(blog._id)} className="text-yellow-700 font-semibold hover:underline">Edit</button>
                                <button onClick={() => handlePreview(blog._id)} className="text-blue-600 font-semibold hover:underline">Preview</button>
                                <button onClick={() => handleDelete(blog._id)} className="ml-auto bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div>
                    <h3 className="text-2xl font-semibold mb-4 text-gray-700">Published</h3>
                    {blogs.published.length === 0 && <p className="text-gray-400">No published posts yet.</p>}
                    {blogs.published.map((blog) => (
                        <div key={blog._id} className="p-4 mb-4 bg-white border-l-4 border-green-400 rounded-lg shadow hover:shadow-lg transition">
                            <h4 className="font-bold text-lg mb-1">{blog.title}</h4>
                            {tagChips(blog)}
                            <p className="text-xs text-gray-400 mb-2">
                                Published {formatDateTime(blog.publishedAt)} · {plural(blog.views, 'view')} · {blog.readingTime} min read
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(blog._id)} className="text-green-700 font-semibold hover:underline">Edit</button>
                                <Link to={`/post/${blog.slug}`} className="text-blue-600 font-semibold hover:underline">View live</Link>
                                <button onClick={() => handleDelete(blog._id)} className="ml-auto bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default BlogList;
