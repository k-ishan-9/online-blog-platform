import { Link } from 'react-router-dom';

function NotFoundPage() {
    return (
        <div className="max-w-md mx-auto mt-20 text-center">
            <h1 className="text-5xl font-extrabold text-blue-700 mb-2">404</h1>
            <p className="text-gray-600 mb-4">This page doesn't exist.</p>
            <Link to="/" className="text-blue-700 underline">Go to the home page</Link>
        </div>
    );
}

export default NotFoundPage;
