/**
 * An Error that carries an HTTP status code (and optional per-field
 * validation details) so the error handler can send a clean JSON
 * response instead of a generic 500.
 */
export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message - safe to show to the user
   * @param {Object} [details] - e.g. { firstName: "This field is required." }
   */
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Wraps an async route handler so rejected promises reach Express's
 * error handler (Express 4 doesn't do this on its own).
 * @param {Function} fn
 */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
