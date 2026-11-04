import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { saveDraft, publishBlog } from '../services/api';
import Notification from './Notification';
import useDebounce from '../hooks/useDebounce';
import { errorMessage, tagsToText, countWords } from '../utils/format';

const EMPTY_BLOG = { title: '', content: '', tags: '', status: 'draft' };

// Auto-save only applies to drafts that have a title and some content.
// Edits to a live post wait for "Update post", so half-finished changes never go public.
const canAutoSave = (blog) => blog.status !== 'published' && blog.title.trim() !== '' && blog.content !== '';

function BlogEditor({ setView, fetchBlogs, editBlog }) {
    const [currentBlog, setCurrentBlog] = useState(
        editBlog ? { ...editBlog, tags: tagsToText(editBlog.tags) } : EMPTY_BLOG
    );
    const [notification, setNotification] = useState({ message: '', sign: '' });
    const [saving, setSaving] = useState(false);
    const latestBlogRef = useRef(currentBlog); // newest editor content, readable from timers
    const dirtyRef = useRef(false);            // true while there are unsaved changes
    const isPublished = currentBlog.status === 'published';

    useEffect(() => {
        latestBlogRef.current = currentBlog;
    }, [currentBlog]);

    // Safety net: every 30 seconds, save a draft if there are unsaved changes
    useEffect(() => {
        const interval = setInterval(() => {
            const blog = latestBlogRef.current;
            if (dirtyRef.current && canAutoSave(blog)) handleAutoSave(blog);
        }, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounced auto-save: runs 5 seconds after the writer stops typing
    const debouncedSave = useDebounce(async (blogData) => {
        if (canAutoSave(blogData)) await handleAutoSave(blogData);
    }, 5000);

    const handleChange = useCallback((field, value) => {
        setCurrentBlog((prev) => {
            const updated = { ...prev, [field]: value };
            dirtyRef.current = true;
            debouncedSave(updated);
            return updated;
        });
    }, [debouncedSave]);

    // Keep what the writer typed while a request was in flight; only adopt what the server
    // decided (id, status, slug), so later saves update the same post instead of duplicating it
    const adoptSaved = (saved) => {
        setCurrentBlog((prev) => ({ ...prev, _id: saved._id, status: saved.status, slug: saved.slug }));
    };

    const handleAutoSave = async (blogData) => {
        dirtyRef.current = false;
        try {
            const saved = await saveDraft(blogData);
            setNotification({ message: 'Draft auto-saved', sign: '+' });
            adoptSaved(saved);
            fetchBlogs();
        } catch (err) {
            dirtyRef.current = true; // the next 30-second tick retries
            setNotification({ message: 'Auto-save failed: ' + errorMessage(err), sign: '-' });
        }
    };

    const runSave = async (action, successMessage) => {
        debouncedSave.cancel(); // a pending auto-save must not undo this explicit action
        setSaving(true);
        try {
            const saved = await action(currentBlog);
            dirtyRef.current = false;
            adoptSaved(saved);
            setNotification({ message: successMessage, sign: '+' });
            fetchBlogs();
        } catch (err) {
            setNotification({ message: errorMessage(err), sign: '-' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDraft = () =>
        runSave(saveDraft, isPublished ? 'Unpublished: the post is a draft again' : 'Draft saved');
    const handlePublish = () =>
        runSave(publishBlog, isPublished ? 'Live post updated' : 'Published! It is now on the public feed');

    const words = countWords(currentBlog.content);
    const buttonBase = 'px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50';

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-blue-200">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
                <h2 className="text-3xl font-extrabold text-blue-700">{currentBlog._id ? 'Edit post' : 'New post'}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {isPublished ? 'Published' : 'Draft'}
                </span>
            </div>
            <input
                type="text"
                value={currentBlog.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Blog Title"
                maxLength={150}
                className="w-full p-4 mb-6 border-2 border-blue-200 rounded-lg text-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
            <ReactQuill
                value={currentBlog.content}
                onChange={(value, delta, source) => {
                    // Only the writer's own edits count as changes, not Quill normalising loaded HTML
                    if (source === 'user') handleChange('content', value);
                    else setCurrentBlog((prev) => ({ ...prev, content: value }));
                }}
                className="mb-6 bg-white rounded-lg"
                theme="snow"
                placeholder="Start writing your amazing story..."
            />
            <input
                type="text"
                value={currentBlog.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                placeholder="Tags, comma-separated (up to 5), e.g. react, career"
                className="w-full p-3 mb-3 border-2 border-blue-200 rounded-lg text-lg"
            />
            <p className="text-sm text-gray-500 mb-6">
                {words} words · ~{Math.max(1, Math.ceil(words / 200))} min read
                {!isPublished && ' · drafts auto-save 5 seconds after you stop typing'}
            </p>
            <div className="flex flex-wrap gap-3 justify-end">
                {isPublished && currentBlog.slug && (
                    <Link to={`/post/${currentBlog.slug}`} className={`${buttonBase} bg-white border-2 border-green-500 text-green-700 hover:bg-green-50`}>
                        View live post
                    </Link>
                )}
                <button onClick={handleSaveDraft} disabled={saving} className={`${buttonBase} bg-gray-700 text-white hover:bg-gray-900`}>
                    {isPublished ? 'Unpublish' : 'Save Draft'}
                </button>
                <button onClick={handlePublish} disabled={saving} className={`${buttonBase} bg-gradient-to-r from-green-500 to-green-700 text-white hover:from-green-600 hover:to-green-800`}>
                    {isPublished ? 'Update post' : 'Publish'}
                </button>
                <button
                    onClick={() => {
                        fetchBlogs();
                        setView('list');
                    }}
                    className={`${buttonBase} bg-blue-500 text-white hover:bg-blue-700`}
                >
                    My Posts
                </button>
            </div>
            <Notification notification={notification} setNotification={setNotification} />
        </div>
    );
}

export default BlogEditor;
