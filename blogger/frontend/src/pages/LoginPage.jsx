import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { login } from '../services/api';
import { errorMessage } from '../utils/format';

const inputClass =
    'w-full p-2 mb-4 border border-gray-300 rounded bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200';

function LoginPage() {
    const { user, refresh } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const goTo = location.state?.from || '/dashboard';
    if (user) return <Navigate to={goTo} replace />;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await login({ email, password });
            await refresh();
            navigate(goTo, { replace: true });
        } catch (err) {
            setError(errorMessage(err, 'Login failed'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-center">Welcome back</h2>
            {location.state?.message && <p className="mb-4 text-green-700 text-center">{location.state.message}</p>}
            <form onSubmit={handleLogin}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} required />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={inputClass} required />
                <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50">
                    {submitting ? 'Logging in…' : 'Login'}
                </button>
                {error && <p className="mt-3 text-red-600">{error}</p>}
            </form>
            <p className="mt-4 text-center text-gray-600">
                No account yet? <Link to="/signup" className="text-blue-700 underline">Sign up</Link>
            </p>
        </div>
    );
}

export default LoginPage;
