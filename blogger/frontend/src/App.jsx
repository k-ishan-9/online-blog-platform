import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import FeedPage from './pages/FeedPage';
import PostPage from './pages/PostPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NotFoundPage from './pages/NotFoundPage';

// Code splitting: the dashboard (with the heavy rich-text editor) and the admin console
// are separate bundles, so readers of the public feed never download them.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function App() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-8">
                <Suspense fallback={<p className="text-center text-gray-500 mt-20">Loading…</p>}>
                    <Routes>
                        <Route path="/" element={<FeedPage />} />
                        <Route path="/post/:slug" element={<PostPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <DashboardPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute role="admin">
                                    <AdminPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </main>
        </div>
    );
}

export default App;
