import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PostCard from '../components/PostCard';
import useDebounce from '../hooks/useDebounce';
import useAuth from '../hooks/useAuth';
import { getFeed, getTopTags } from '../services/api';
import { errorMessage } from '../utils/format';

const PAGE_SIZE = 6;

// Public home page: published posts, newest first, with search, tag filter and "Load more".
// The search text and tag live in the URL (?q=...&tag=...), so a search can be shared or bookmarked.
function FeedPage() {
    const { user } = useAuth();
    const [params, setParams] = useSearchParams();
    const q = params.get('q') || '';
    const tag = params.get('tag') || '';

    const [searchText, setSearchText] = useState(q);
    const [items, setItems] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');

    const updateParam = (key, value) => {
        setParams((prev) => {
            const next = new URLSearchParams(prev);
            if (value) next.set(key, value);
            else next.delete(key);
            return next;
        }, { replace: true });
    };

    // Same debounce hook as the editor: search only after the reader pauses typing
    const debouncedSearch = useDebounce((value) => updateParam('q', value.trim()), 400);

    useEffect(() => {
        getTopTags().then(setTags).catch(() => setTags([]));
    }, []);

    // Load the first page whenever the search or tag changes
    useEffect(() => {
        let cancelled = false; // ignore a slow response that arrives after a newer search
        setLoading(true);
        setError('');
        getFeed({ q: q || undefined, tag: tag || undefined, limit: PAGE_SIZE })
            .then((page) => {
                if (cancelled) return;
                setItems(page.items);
                setNextCursor(page.nextCursor);
            })
            .catch((err) => !cancelled && setError(errorMessage(err)))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [q, tag]);

    const loadMore = async () => {
        setLoadingMore(true);
        try {
            const page = await getFeed({ q: q || undefined, tag: tag || undefined, limit: PAGE_SIZE, cursor: nextCursor });
            setItems((prev) => [...prev, ...page.items]);
            setNextCursor(page.nextCursor);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <div>
            <section className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-blue-800">Stories from the Blogify community</h1>
                <p className="text-gray-600 mt-2">Read what writers are publishing, search by topic, or filter by tag.</p>
                {!user && (
                    <Link to="/signup" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800">
                        Start writing for free
                    </Link>
                )}
            </section>

            <input
                type="search"
                value={searchText}
                onChange={(e) => {
                    setSearchText(e.target.value);
                    debouncedSearch(e.target.value);
                }}
                placeholder="Search posts by title, tag or content…"
                aria-label="Search posts"
                className="w-full p-4 mb-4 border-2 border-blue-200 rounded-xl text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <div className="flex flex-wrap gap-2 mb-8">
                <button
                    onClick={() => updateParam('tag', '')}
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${!tag ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-200'}`}
                >
                    All
                </button>
                {tags.map((t) => (
                    <button
                        key={t.tag}
                        onClick={() => updateParam('tag', t.tag === tag ? '' : t.tag)}
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${t.tag === tag ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-200'}`}
                    >
                        #{t.tag} <span className="opacity-70">{t.count}</span>
                    </button>
                ))}
            </div>

            {error && <p className="mb-4 text-red-600">{error}</p>}
            {loading ? (
                <p className="text-center text-gray-500">Loading posts…</p>
            ) : items.length === 0 ? (
                <p className="text-center text-gray-500">No posts found{q ? ` for "${q}"` : ''}{tag ? ` tagged #${tag}` : ''}.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {items.map((post) => (
                        <PostCard key={post._id} post={post} onTagClick={(t) => updateParam('tag', t)} />
                    ))}
                </div>
            )}

            {nextCursor && !loading && (
                <div className="text-center mt-8">
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="bg-white border-2 border-blue-300 text-blue-700 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 disabled:opacity-50"
                    >
                        {loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default FeedPage;
