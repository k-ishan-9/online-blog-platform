import { useState, useCallback, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { saveDraft, publishBlog } from '../services/api';
import Notification from './Notification';
import useDebounce from '../hooks/useDebounce';

const EMPTY_BLOG = { id: '', title: '', content: '', tags: '', status: 'draft' };

// Pull the server's error message out of an Axios error when there is one
const errorText = (err) => err.response?.data?.message || err.message;

function BlogEditor({ setView, fetchBlogs, editBlog }) {
    const [currentBlog, setCurrentBlog] = useState(editBlog || EMPTY_BLOG);
    const [notification, setNotification] = useState({message: '', sign: '' });
    const latestBlogRef = useRef(currentBlog); // newest editor content, readable from timers
    const dirtyRef = useRef(false);            // true while there are unsaved changes

    useEffect(() => {
        latestBlogRef.current = currentBlog;
    }, [currentBlog]);

    // Safety net: every 30 seconds, save if there are unsaved changes
    useEffect(() => {
        const interval = setInterval(() => {
            if (dirtyRef.current) handleAutoSave(latestBlogRef.current);
        }, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounced auto-save after 5s inactivity
    const debouncedSave = useDebounce(async (blogData) => {
        await handleAutoSave(blogData);
    }, 5000);

    const handleChange = useCallback((field, value) => {
        setCurrentBlog(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'title' || field === 'content' || field === 'tags') {
                dirtyRef.current = true;
                debouncedSave(updated);
            }
            return updated;
        });
    }, [debouncedSave]);

    // Keep what the user has typed since the request was sent; only adopt the
    // server's id, so later saves update the same post instead of creating duplicates
    const adoptSavedId = (saved) => {
        setCurrentBlog(prev => ({ ...prev, _id: saved._id }));
    };

    const handleAutoSave = async (blogData = currentBlog) => {
        if (!blogData.title && !blogData.content) return;
        dirtyRef.current = false;
        try {
            const response = await saveDraft(blogData);
            setNotification({message: 'Draft auto-saved!', sign: '+' });
            adoptSavedId(response);
            fetchBlogs();
        } catch (err) {
            dirtyRef.current = true;
            setNotification({ message: 'Auto-save failed! ' + errorText(err), sign: '-' });
        }
    };

    const handleSaveDraft = async () => {
        debouncedSave.cancel(); // a manual save replaces any pending auto-save
        dirtyRef.current = false;
        try {
            const response = await saveDraft(currentBlog);
            setNotification({message: 'Draft saved!', sign: '+' });
            adoptSavedId(response);
            fetchBlogs();
        } catch (err) {
            dirtyRef.current = true;
            setNotification({ message: 'Error saving draft! ' + errorText(err), sign: '-' });
        }
    };

    const handlePublish = async () => {
        debouncedSave.cancel(); // stop a pending auto-save from turning it back into a draft
        try {
            await publishBlog({ ...currentBlog, status: 'published' });
            dirtyRef.current = false;
            setNotification({message: 'Blog published!', sign: '+' });
            setCurrentBlog(EMPTY_BLOG);
            fetchBlogs();
        } catch (error) {
            setNotification({ message: 'Error publishing blog! ' + errorText(error), sign: '-' });
        }
    };

    return (
        <div className="min-w-[60vw] max-w-[70vw] mx-auto mt-10 p-8 bg-gradient-to-br from-white via-blue-[#eff6ee] to-blue-50 rounded-2xl shadow-2xl border border-blue-200">
            <h2 className="text-4xl font-extrabold mb-6 text-blue-700 drop-shadow">✍️ Write Your Blog</h2>
            <input
                type="text"
                value={currentBlog.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Blog Title"
                className="w-full p-4 mb-6 border-2 border-blue-200 rounded-lg text-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
            <ReactQuill
                value={currentBlog.content}
                onChange={(value) => handleChange('content', value)}
                className="mb-6 bg-white rounded-lg"
                theme="snow"
                placeholder="Start writing your amazing story..."
            />
            <input
                type="text"
                value={currentBlog.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                placeholder="Tags (comma-separated)"
                className="w-full p-3 mb-6 border-2 border-blue-200 rounded-lg text-lg"
            />
            <div className="flex flex-wrap gap-4 justify-end">
                <button
                    onClick={handleSaveDraft}
                    className="bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-900 transition"
                >
                    Save Draft
                </button>
                <button
                    onClick={handlePublish}
                    className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-500 hover:to-green-700 transition"
                >
                    Publish
                </button>
                <button
                    onClick={() => setView('list')}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    View Blogs
                </button>
            </div>
            <Notification notification={notification} setNotification={setNotification} />
        </div>
    );
}

export default BlogEditor;