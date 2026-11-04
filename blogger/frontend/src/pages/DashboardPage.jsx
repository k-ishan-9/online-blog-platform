import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BlogEditor from '../components/BlogEditor';
import BlogList from '../components/BlogList';
import DisplayBlog from '../components/DisplayBlog';
import useAuth from '../hooks/useAuth';
import { getBlog, getMyBlogs, getMyStats } from '../services/api';
import { errorMessage } from '../utils/format';

function StatCard({ label, value, color }) {
    return (
        <div className={`p-5 rounded-2xl bg-white shadow border-t-4 ${color}`}>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-extrabold text-gray-900">{value ?? '–'}</p>
        </div>
    );
}

// The writer's workspace: stats, their posts, and the editor
function DashboardPage() {
    const { refresh } = useAuth();
    const [params, setParams] = useSearchParams();
    const [view, setView] = useState('list');
    const [blogs, setBlogs] = useState({ drafts: [], published: [] });
    const [stats, setStats] = useState(null);
    const [editBlog, setEditBlog] = useState(null);
    const [showBlog, setShowBlog] = useState(null);
    const [error, setError] = useState('');

    const fetchBlogs = useCallback(async () => {
        try {
            const [mine, myStats] = await Promise.all([getMyBlogs(), getMyStats()]);
            setBlogs({
                drafts: mine.filter((b) => b.status === 'draft'),
                published: mine.filter((b) => b.status === 'published'),
            });
            setStats(myStats);
        } catch (err) {
            if (err.response?.status === 401) refresh(); // session expired: the route guard sends you to login
            else setError(errorMessage(err));
        }
    }, [refresh]);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    // /dashboard?edit=<id> opens that post in the editor (the "Edit post" button on a post page)
    const editId = params.get('edit');
    useEffect(() => {
        if (!editId) return;
        getBlog(editId)
            .then((blog) => {
                setEditBlog(blog);
                setView('editor');
            })
            .catch((err) => setError(errorMessage(err)))
            .finally(() => setParams({}, { replace: true }));
    }, [editId, setParams]);

    if (showBlog) return <DisplayBlog blog={showBlog} onBack={() => setShowBlog(null)} />;

    return (
        <div>
            {error && <p className="mb-4 text-center text-red-600">{error}</p>}
            {view === 'editor' ? (
                <BlogEditor key={editBlog?._id || 'new'} setView={setView} fetchBlogs={fetchBlogs} editBlog={editBlog} />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <StatCard label="Drafts" value={stats?.drafts} color="border-yellow-400" />
                        <StatCard label="Published" value={stats?.published} color="border-green-500" />
                        <StatCard label="Total views" value={stats?.totalViews} color="border-blue-500" />
                    </div>
                    <BlogList
                        blogs={blogs}
                        setView={setView}
                        fetchBlogs={fetchBlogs}
                        setEditBlog={setEditBlog}
                        setShowBlog={setShowBlog}
                        onError={setError}
                    />
                </>
            )}
        </div>
    );
}

export default DashboardPage;
