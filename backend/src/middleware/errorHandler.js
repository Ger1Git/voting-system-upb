export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const body = {
    error: err.message || 'Internal server error',
    code: err.code,
  };
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    body.stack = err.stack;
  }
  console.error(err);
  res.status(status).json(body);
}
