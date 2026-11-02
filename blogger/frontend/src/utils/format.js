export const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '');

// Turns an Axios error into one readable sentence, including the server's field errors
export const errorMessage = (err, fallback = 'Something went wrong') => {
    const data = err?.response?.data;
    if (data?.errors?.length) return data.errors.map((e) => e.message).join('. ');
    return data?.message || err?.message || fallback;
};

export const tagsToText = (tags) => (Array.isArray(tags) ? tags.join(', ') : tags || '');

// Rough plain-text word count of editor HTML, for the live "min read" hint
export const countWords = (html) => {
    const text = (html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    return text ? text.split(/\s+/).length : 0;
};

export const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
