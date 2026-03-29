// Wraps any async controller so you never need try/catch inside them.
// Errors are forwarded to Express's error-handling middleware automatically.

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export { asyncHandler };