import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Guard middleware. Requires a valid access token in
 *   Authorization: Bearer <token>
 * On success attaches req.user = { id, role }. On failure responds 401.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    const err = new Error('Missing or malformed Authorization header');
    err.status = 401;
    return next(err);
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (e) {
    const err = new Error('Invalid or expired token');
    err.status = 401;
    return next(err);
  }
}

/**
 * Role guard factory. Use AFTER requireAuth.
 *   router.get('/x', requireAuth, requireRole('admin'), handler)
 */
export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error('Authentication required');
      err.status = 401;
      return next(err);
    }
    if (!allowed.includes(req.user.role)) {
      const err = new Error('Forbidden');
      err.status = 403;
      return next(err);
    }
    next();
  };
}
