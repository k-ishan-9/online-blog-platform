import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { formatDateTime } from '../utils/format';

// Private preview of a draft, inside the dashboard
function DisplayBlog({ blog, onBack }) {
    const safeHtml = useMemo(() => DOMPurify.sanitize(blog?.content || ''), [blog]);
    if (!blog) return null;

    return (
        <article className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-blue-200">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">← Back</button>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">Draft preview: only you can see this</span>
            </div>
            <h1 className="text-4xl font-extrabold mb-4 text-gray-900">{blog.title}</h1>
            <div className="mb-6 flex flex-wrap gap-2">
                {blog.tags?.map((tag) => (
                    <span key={tag} className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">#{tag}</span>
                ))}
            </div>
            <div className="post-content mb-8" dangerouslySetInnerHTML={{ __html: safeHtml }} />
            <div className="text-right text-gray-500 text-sm">Last saved {formatDateTime(blog.updated_at)}</div>
        </article>
    );
}

export default DisplayBlog;
