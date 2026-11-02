import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import useAuth from '../hooks/useAuth';
import { getPublicPost } from '../services/api';
import { errorMessage, formatDate, plural } from '../utils/format';

// A published post at /post/:slug. The server already sanitized the HTML when it was saved;
// DOMPurify cleans it again in the browser (defence in depth) before it is rendered.
function PostPage() {
    const { slug } = useParams();
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setPost(null);
        setError('');
        getPublicPost(slug)
            .then((p) => !cancelled && setPost(p))
            .catch((err) => {
                if (cancelled) return;
                setError(err.response?.status === 404 ? 'This post does not exist or is no longer published.' : errorMessage(err));
            });
        return () => {
            cancelled = true;
        };
    }, [slug]);

    const safeHtml = useMemo(() => (post ? DOMPurify.sanitize(post.content) : ''), [post]);

    if (error) {
        return (
            <div className="max-w-xl mx-auto mt-16 text-center">
                <p className="text-gray-700 mb-4">{error}</p>
                <Link to="/" className="text-blue-700 underline">Back to all posts</Link>
            </div>
        );
    }
    if (!post) return <p className="text-center text-gray-500 mt-20">Loading…</p>;

    const isMine = user && post.author?._id === user.id;

    return (
        <article className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-blue-100">
            <div className="flex justify-between items-center mb-6">
                <Link to="/" className="text-blue-700 hover:underline">← All posts</Link>
                {isMine && (
                    <Link to={`/dashboard?edit=${post._id}`} className="bg-yellow-500 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-yellow-600">
                        Edit post
                    </Link>
                )}
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                    <Link key={tag} to={`/?tag=${tag}`} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold hover:bg-blue-200">
                        #{tag}
                    </Link>
                ))}
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900">{post.title}</h1>
            <p className="text-gray-500 mt-2 mb-8">
                By <span className="font-semibold text-gray-700">{post.author?.name || 'Unknown author'}</span> · {formatDate(post.publishedAt)} ·{' '}
                {post.readingTime} min read · {plural(post.views, 'view')}
            </p>
            <div className="post-content" dangerouslySetInnerHTML={{ __html: safeHtml }} />
        </article>
    );
}

export default PostPage;
