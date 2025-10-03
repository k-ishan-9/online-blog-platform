import { useState, useEffect } from 'react';
import BlogEditor from './components/BlogEditor';
import BlogList from './components/BlogList';
import Login from './components/Login';
import Signup from './components/Signup';
import DisplayBlog from './components/DisplayBlog';
import { authCheckOnMount, getBlogs, logout } from './services/api';

function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [blogs, setBlogs] = useState({ drafts: [], published: [] });
    const [view, setView] = useState('editor');
    const [editBlog, setEditBlog] = useState(null);
    const [showLogin, setShowLogin] = useState(true);
    const [showBlog, setShowBlog] = useState(null);
    const customStyle = " flex flex-col justify-center";
    const appStyle = "min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-100" + (!loggedIn || showBlog != null ? customStyle : "");

    useEffect(() => {
        if (loggedIn) fetchBlogs();
    }, [loggedIn]);

    useEffect(() => {
    // Check if user is authenticated on mount
    setLoggedIn(authCheckOnMount());
}, []);

    const fetchBlogs = async () => {
        try {
            const data = await getBlogs();
            setBlogs({
                drafts: data.filter(blog => blog.status === 'draft'),
                published: data.filter(blog => blog.status === 'published')
            });
        } catch (error) {
            setLoggedIn(false);
        }
    };

    const handleLogout = async () => {
        if(!window.confirm('Are you sure you want to logout?')) return;
        try {
            await logout();
            setLoggedIn(false);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

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
                    <div className="flex justify-end p-4">
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                            Logout
                        </button>
                    </div>
                    {view === 'editor' ? (
                        <BlogEditor
                            setView={setView}
                            fetchBlogs={fetchBlogs}
                            editBlog={editBlog}
                            setEditBlog={setEditBlog}
                        />
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