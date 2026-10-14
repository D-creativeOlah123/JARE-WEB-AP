import { env } from '../config/env.js';

export function notFound(req, res, next) {
  res.status(404).json({
    error: { message: `Not found: ${req.method} ${req.originalUrl}` },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isClientErr = status >= 400 && status < 500;
  const safeMessage = isClientErr || !env.isProd ? err.message : 'Internal server error';

  if (status >= 500) console.error(err);

  res.status(status).json({
    error: {
      message: safeMessage,
      ...(err.details ? { details: err.details } : {}),
      ...(env.isProd ? {} : { stack: err.stack }),
    },
  });
}
