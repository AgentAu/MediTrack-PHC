/**
 * auth.js
 * ------------------------------------------------------------------
 * authenticate: verifies the Firebase ID token sent by the React app
 *   in the "Authorization: Bearer <token>" header and attaches
 *   req.user = { uid, email, name, role }.
 *   `checkRevoked = true` means a token stops working as soon as an
 *   admin deactivates the account or changes its role.
 *
 * requireRole: blocks the request unless req.user.role is allowed.
 *   This is where the permissions table is actually enforced. The
 *   client hides buttons too, but that's only for convenience.
 * ------------------------------------------------------------------
 */

import { auth } from "../config/firebase.js";
import { ALL_ROLES } from "../config/roles.js";
import { HttpError } from "../utils/httpError.js";

export async function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Sign in to continue."));
  }

  let decoded;
  try {
    decoded = await auth.verifyIdToken(token, true);
  } catch (err) {
    const message =
      err.code === "auth/user-disabled"
        ? "This account has been deactivated. Contact an administrator."
        : "Your session has expired. Sign in again.";
    return next(new HttpError(401, message));
  }

  if (!ALL_ROLES.includes(decoded.role)) {
    return next(new HttpError(403, "This account has no role yet. Ask an administrator to assign one."));
  }

  req.user = {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name || decoded.email,
    role: decoded.role,
  };
  return next();
}

/**
 * @param  {...string} allowedRoles
 */
export const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (req.user && allowedRoles.includes(req.user.role)) return next();
    return next(new HttpError(403, "Your role doesn't have permission to do that."));
  };
