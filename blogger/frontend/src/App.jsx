import { useState, useEffect } from 'react';
import BlogEditor from './components/BlogEditor';
import BlogList from './components/BlogList';
import Login from './components/Login';
import Signup from './components/Signup';
import DisplayBlog from './components/DisplayBlog';
import AdminPanel from './components/AdminPanel';
import { authCheckOnMount, getBlogs, logout } from './services/api';

function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [user, setUser] = useState(null); // { id, email, role } from the JWT
    const [blogs, setBlogs] = useState({ drafts: [], published: [] });
    const [view, setView] = useState('editor');
    const [editBlog, setEditBlog] = useState(null);
    const [showLogin, setShowLogin] = useState(true);
    const [showBlog, setShowBlog] = useState(null);
    const customStyle = " flex flex-col justify-center";
    const appStyle = "min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-100" + (!loggedIn || showBlog != null ? customStyle : "");

    // On first load, restore the session if the JWT cookie is still valid
    useEffect(() => {
        authCheckOnMount().then(currentUser => {
            setUser(currentUser);
            setLoggedIn(Boolean(currentUser));
        });
    }, []);

    // After login, load the user's identity and their own posts
    useEffect(() => {
        if (!loggedIn) return;
        authCheckOnMount().then(setUser);
        fetchBlogs();
    }, [loggedIn]);

    const resetSession = () => {
        setLoggedIn(false);
        setUser(null);
        setBlogs({ drafts: [], published: [] });
        setEditBlog(null);
        setShowBlog(null);
        setView('editor');
    };

    const fetchBlogs = async () => {
        try {
            const data = await getBlogs();
            setBlogs({
                drafts: data.filter(blog => blog.status === 'draft'),
                published: data.filter(blog => blog.status === 'published')
            });
        } catch {
            resetSession(); // 401: session expired or invalid
        }
    };

    const handleLogout = async () => {
        if(!window.confirm('Are you sure you want to logout?')) return;
        try {
            await logout();
            resetSession();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const isAdmin = user?.role === 'admin';

    return (
        <div className={appStyle}>
            {!loggedIn ? (
                showLogin ? (
                    <Login setLoggedIn={setLoggedIn} setShowLogin={setShowLogin} />
                ) : (
                    <Signup setShowLogin={setShowLogin} />
                )
            ) : showBlog ? (
                <DisplayBlog blog={showBlog} onBack={() => setShowBlog(null)} />
            ) : (
                <>
                    <div className="flex justify-between items-center p-4">
                        <div className="text-gray-700">
                            {user && (
                                <>
                                    Signed in as <span className="font-semibold">{user.email}</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${isAdmin ? 'bg-purple-200 text-purple-800' : 'bg-blue-200 text-blue-800'}`}>
                                        {user.role || 'author'}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {isAdmin && (
                                <button
                                    onClick={() => setView('admin')}
                                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-800"
                                >
                                    Admin Panel
                                </button>
                            )}
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                    {view === 'editor' ? (
                        <BlogEditor
                            setView={setView}
                            fetchBlogs={fetchBlogs}
                            editBlog={editBlog}
                            setEditBlog={setEditBlog}
                        />
                    ) : view === 'admin' && isAdmin ? (
                        <AdminPanel setView={setView} />
                    ) : (
                        <BlogList
                            blogs={blogs}
                            setView={setView}
                            fetchBlogs={fetchBlogs}
                            setEditBlog={setEditBlog}
                            setShowBlog={setShowBlog}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default App;
