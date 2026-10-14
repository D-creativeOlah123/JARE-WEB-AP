import { validationResult } from 'express-validator';

/**
 * Reads the validation errors collected by express-validator rules on a
 * route. If any exist, responds 400. Otherwise passes control to the
 * next handler.
 */
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  const err = new Error('Validation failed');
  err.status = 400;
  err.details = details;
  next(err);
}
