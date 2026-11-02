// Express 5 forwards errors thrown in async route handlers here automatically,
// so handlers don't need their own try/catch.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for ${err.path}` });
  }
  if (err.name === 'VersionError') {
    return res.status(409).json({ message: 'This post was changed by another request. Please retry.' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That value is already taken', fields: Object.keys(err.keyValue || {}) });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  // Never leak stack traces or internal messages to clients
  res.status(status).json({ message: status >= 500 ? 'Something went wrong on our side' : err.message });
};
