/**
 * Central error handler: turns HttpErrors into JSON responses and
 * hides internal error details from the client (they're logged
 * on the server instead).
 */

import { HttpError } from "../utils/httpError.js";

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "The request body isn't valid JSON." });
  }

  // Firestore says an index is missing: the log contains a link to create it.
  if (err.code === 9 || /requires an index/i.test(err.message || "")) {
    console.error("[MediTrack] Firestore needs an index. Open the link below to create it:\n", err.message);
    return res.status(500).json({ error: "The database needs a one-time index setup. Check the server log." });
  }

  console.error("[MediTrack] Unexpected error:", err);
  return res.status(500).json({ error: "Something went wrong on the server. Try again." });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}` });
}
