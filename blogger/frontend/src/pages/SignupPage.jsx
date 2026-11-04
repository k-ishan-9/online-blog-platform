import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { signup } from '../services/api';
import { errorMessage } from '../utils/format';

const inputClass =
    'w-full p-2 mb-4 border border-gray-300 rounded bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200';

function SignupPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (user) return <Navigate to="/dashboard" replace />;

    const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        // Quick checks in the browser for fast feedback; the server validates again with Zod
        if (form.password.length < 8) return setError('Password must be at least 8 characters');
        if (form.password !== form.confirm) return setError('Passwords do not match');

        setSubmitting(true);
        try {
            await signup({ name: form.name.trim() || undefined, email: form.email, password: form.password });
            navigate('/login', { state: { message: 'Account created. Please log in.' } });
        } catch (err) {
            setError(errorMessage(err, 'Signup failed'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-center">Create your account</h2>
            <form onSubmit={handleSignup}>
                <input type="text" value={form.name} onChange={update('name')} placeholder="Display name (shown on your posts)" className={inputClass} maxLength={50} />
                <input type="email" value={form.email} onChange={update('email')} placeholder="Email" className={inputClass} required />
                <input type="password" value={form.password} onChange={update('password')} placeholder="Password (8+ characters)" className={inputClass} required />
                <input type="password" value={form.confirm} onChange={update('confirm')} placeholder="Confirm password" className={inputClass} required />
                <button type="submit" disabled={submitting} className="w-full bg-green-600 text-white p-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
                    {submitting ? 'Creating account…' : 'Sign up'}
                </button>
                {error && <p className="mt-3 text-red-600">{error}</p>}
            </form>
            <p className="mt-4 text-center text-gray-600">
                Already have an account? <Link to="/login" className="text-blue-700 underline">Login</Link>
            </p>
        </div>
    );
}

export default SignupPage;
