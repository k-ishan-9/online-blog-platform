import { useState } from 'react';
import { login } from '../services/api';

function Login({ setLoggedIn, setShowLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await login({ email, password });
            setLoggedIn(true);
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="max-w-md mx-auto px-auto p-6 bg-white rounded-lg shadow flex flex-col items-center">
            <h2 className="text-3xl font-bold mb-4 ">Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full p-2 mb-4 border border-gray-300 rounded bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full p-2 mb-4 border border-gray-300 rounded bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200"
                    required
                />
                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    Login
                </button>
                {error && <p className="mt-2 text-red-500">{error}</p>}
            </form>
            <p className="mt-4 text-center">
                Don't have an account?{' '}
                <button className="text-green-600 underline" onClick={() => setShowLogin(false)}>
                    Sign Up
                </button>
            </p>
        </div>
    );
}

export default Login;