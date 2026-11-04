// Validates part of the request against a Zod schema.
// On success the parsed, cleaned values replace the raw input; on failure: 400 with field errors.
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      })),
    });
  }
  // Express 5 makes req.query read-only, so parsed query values go on req.validQuery
  if (source === 'query') req.validQuery = result.data;
  else req[source] = result.data;
  next();
};
