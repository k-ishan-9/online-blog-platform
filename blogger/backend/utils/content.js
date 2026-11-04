import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';

// Only the HTML the Quill editor produces is kept. Scripts, event handlers (onerror=...),
// javascript: links and unknown tags are stripped before anything is stored.
const EDITOR_HTML = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h1', 'h2', 'h3', 'blockquote', 'pre', 'code', 'ol', 'ul', 'li', 'a', 'span', 'img'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt'],
    '*': ['class'],
  },
  allowedClasses: { '*': ['ql-*'] }, // Quill's own alignment, indent and code classes only
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
  },
};

export const sanitizeContent = (html) => sanitizeHtml(html, EDITOR_HTML);

const decodeEntities = (text) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, '&');

export const toPlainText = (html) =>
  decodeEntities(
    sanitizeHtml(html.replace(/<\/(p|h[1-6]|li|blockquote|pre)>|<br\s*\/?>/gi, ' '), {
      allowedTags: [],
      allowedAttributes: {},
    })
  )
    .replace(/\s+/g, ' ')
    .trim();

export const readingTimeMinutes = (text) => {
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200)); // ~200 words per minute
};

export const makeExcerpt = (text, max = 180) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : max)}…`;
};

// "Hello, World!" -> "hello-world-3f9a1c": readable, plus a random suffix so titles can repeat
export const makeSlug = (title) => {
  const base =
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'post';
  return `${base}-${crypto.randomBytes(3).toString('hex')}`;
};

// Everything the server derives from what the writer typed
export const buildContentFields = ({ title, content, tags }) => {
  const safeHtml = sanitizeContent(content);
  const plainText = toPlainText(safeHtml);
  return {
    title,
    content: safeHtml,
    tags,
    plainText,
    excerpt: makeExcerpt(plainText),
    readingTime: readingTimeMinutes(plainText),
  };
};
