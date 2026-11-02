import { Link } from 'react-router-dom';
import { formatDate, plural } from '../utils/format';

function PostCard({ post, onTagClick }) {
    return (
        <article className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition border border-blue-50 flex flex-col">
            <Link to={`/post/${post.slug}`} className="text-xl font-bold text-gray-900 hover:text-blue-700">
                {post.title}
            </Link>
            <p className="text-sm text-gray-500 mt-1">
                {post.author?.name || 'Unknown author'} · {formatDate(post.publishedAt)} · {post.readingTime} min read · {plural(post.views, 'view')}
            </p>
            <p className="text-gray-700 mt-3 flex-1">{post.excerpt}</p>
            {post.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => onTagClick?.(tag)}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold hover:bg-blue-200"
                        >
                            #{tag}
                        </button>
                    ))}
                </div>
            )}
        </article>
    );
}

export default PostCard;
