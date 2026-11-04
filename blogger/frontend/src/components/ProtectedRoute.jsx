import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Client-side guard for pages. It only improves the experience (redirect to login);
// the real protection is the server, which answers 401/403 whatever the browser does.
function ProtectedRoute({ role, children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <p className="text-center text-gray-500 mt-20">Loading…</p>;
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    if (role && user.role !== role) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-2">403: Not allowed</h2>
                <p className="text-gray-600">This page is for {role}s only.</p>
            </div>
        );
    }
    return children;
}

export default ProtectedRoute;
