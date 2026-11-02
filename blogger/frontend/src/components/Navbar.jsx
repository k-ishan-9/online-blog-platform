import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md font-medium transition ${isActive ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-blue-700'}`;

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <header className="bg-white/80 backdrop-blur border-b border-blue-100 sticky top-0 z-10">
            <nav className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <Link to="/" className="text-2xl font-extrabold text-blue-700">Blogify</Link>
                <div className="flex flex-wrap items-center gap-1">
                    <NavLink to="/" end className={linkClass}>Explore</NavLink>
                    {user && <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>}
                    {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
                    {user ? (
                        <>
                            <span className="ml-3 text-sm text-gray-600">{user.name || user.email}</span>
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${isAdmin ? 'bg-purple-200 text-purple-800' : 'bg-blue-200 text-blue-800'}`}>
                                {user.role}
                            </span>
                            <button onClick={handleLogout} className="ml-3 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className={linkClass}>Login</NavLink>
                            <Link to="/signup" className="ml-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition">
                                Start writing
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default Navbar;
