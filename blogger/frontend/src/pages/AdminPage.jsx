import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminDeleteBlog, getAdminStats, getAllBlogsAdmin, getAuditLog } from '../services/api';
import { errorMessage, formatDateTime } from '../utils/format';

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'posts', label: 'All posts' },
    { id: 'audit', label: 'Audit log' },
];

const ACTION_LABELS = {
    'auth.signup': 'Signed up',
    'auth.login_failed': 'Failed login',
    'blog.publish': 'Published a post',
    'admin.blog_delete': 'Admin deleted a post',
    'user.role_change': 'Role changed',
};

function Overview() {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        getAdminStats().then(setStats).catch((err) => setError(errorMessage(err)));
    }, []);
    if (error) return <p className="text-red-600">{error}</p>;
    if (!stats) return <p className="text-gray-500">Loading…</p>;

    const cards = [
        ['Users', stats.users.total, `${stats.users.admins} admin(s)`],
        ['Published posts', stats.posts.published, `${stats.publishedThisWeek} this week`],
        ['Drafts', stats.posts.drafts, 'not public yet'],
        ['Total views', stats.totalViews, 'across all posts'],
    ];
    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {cards.map(([label, value, note]) => (
                    <div key={label} className="p-5 rounded-2xl bg-white shadow border-t-4 border-purple-400">
                        <p className="text-sm text-gray-500">{label}</p>
                        <p className="text-3xl font-extrabold text-gray-900">{value}</p>
                        <p className="text-xs text-gray-400">{note}</p>
                    </div>
                ))}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Top authors by views</h3>
            <table className="w-full text-left bg-white rounded-xl shadow overflow-hidden">
                <thead className="bg-purple-50 text-gray-600">
                    <tr><th className="p-3">Author</th><th className="p-3">Email</th><th className="p-3">Posts</th><th className="p-3">Published</th><th className="p-3">Views</th></tr>
                </thead>
                <tbody>
                    {stats.topAuthors.map((a) => (
                        <tr key={a.email} className="border-t">
                            <td className="p-3 font-semibold">{a.name}</td><td className="p-3">{a.email}</td>
                            <td className="p-3">{a.posts}</td><td className="p-3">{a.published}</td><td className="p-3">{a.views}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function AllPosts() {
    const [blogs, setBlogs] = useState([]);
    const [error, setError] = useState('');

    const load = useCallback(() => {
        getAllBlogsAdmin().then(setBlogs).catch((err) => setError(errorMessage(err)));
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this post for its author? This is recorded in the audit log.')) return;
        try {
            await adminDeleteBlog(id);
            load();
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    return (
        <div>
            {error && <p className="mb-4 text-red-600">{error}</p>}
            <table className="w-full text-left bg-white rounded-xl shadow overflow-hidden">
                <thead className="bg-purple-50 text-gray-600">
                    <tr><th className="p-3">Title</th><th className="p-3">Author</th><th className="p-3">Status</th><th className="p-3">Views</th><th className="p-3">Updated</th><th className="p-3"></th></tr>
                </thead>
                <tbody>
                    {blogs.map((blog) => (
                        <tr key={blog._id} className="border-t">
                            <td className="p-3 font-semibold">
                                {blog.status === 'published' ? <Link to={`/post/${blog.slug}`} className="hover:underline">{blog.title}</Link> : blog.title}
                            </td>
                            <td className="p-3">{blog.author?.email || 'unknown'}</td>
                            <td className="p-3">{blog.status}</td>
                            <td className="p-3">{blog.views}</td>
                            <td className="p-3 text-sm text-gray-500">{formatDateTime(blog.updated_at)}</td>
                            <td className="p-3 text-right">
                                <button onClick={() => handleDelete(blog._id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {blogs.length === 0 && !error && <p className="text-gray-400 mt-4">No posts yet.</p>}
        </div>
    );
}

function AuditLogTable() {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState('');
    useEffect(() => {
        getAuditLog().then(setEvents).catch((err) => setError(errorMessage(err)));
    }, []);

    return (
        <div>
            <p className="text-gray-600 mb-4">Append-only record of security-relevant events. Entries can't be edited or deleted through the app.</p>
            {error && <p className="mb-4 text-red-600">{error}</p>}
            <table className="w-full text-left bg-white rounded-xl shadow overflow-hidden text-sm">
                <thead className="bg-purple-50 text-gray-600">
                    <tr><th className="p-3">When</th><th className="p-3">Event</th><th className="p-3">Who</th><th className="p-3">Target</th><th className="p-3">IP</th></tr>
                </thead>
                <tbody>
                    {events.map((e) => (
                        <tr key={e._id} className="border-t">
                            <td className="p-3 text-gray-500">{formatDateTime(e.at)}</td>
                            <td className={`p-3 font-semibold ${e.action === 'auth.login_failed' ? 'text-red-600' : ''}`}>{ACTION_LABELS[e.action] || e.action}</td>
                            <td className="p-3">{e.actorEmail || '–'}</td>
                            <td className="p-3">{e.details?.title || e.target || '–'}</td>
                            <td className="p-3 text-gray-500">{e.ip || '–'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Admin console: platform analytics, moderation and the audit trail
function AdminPage() {
    const [tab, setTab] = useState('overview');
    return (
        <div>
            <h2 className="text-3xl font-extrabold text-purple-700 mb-6">Admin console</h2>
            <div className="flex gap-2 mb-6">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-2 rounded-lg font-semibold ${tab === t.id ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 border border-purple-200'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            {tab === 'overview' && <Overview />}
            {tab === 'posts' && <AllPosts />}
            {tab === 'audit' && <AuditLogTable />}
        </div>
    );
}

export default AdminPage;
