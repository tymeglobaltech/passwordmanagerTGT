import { Request, Response, NextFunction } from 'express';
import { isDevelopment } from '../config/environment';

export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * The message that is safe to send to the client.
 *
 * Only errors we raised ourselves (AppError) carry a curated message. Anything
 * else - database driver errors, body parser errors, unexpected throws - is
 * replaced with a generic one so SQL, file paths and internal detail never
 * reach the response body.
 */
const clientMessage = (err: any, statusCode: number): string => {
  if (err instanceof AppError) {
    return err.message;
  }

  // Raised by body-parser before any route runs.
  if (err?.type === 'entity.parse.failed') {
    return 'Invalid JSON payload';
  }
  if (err?.type === 'entity.too.large') {
    return 'Request body too large';
  }

  // Raised by the router when a path or query string cannot be decoded.
  if (err instanceof URIError) {
    return 'Malformed request URL';
  }

  return statusCode < 500 ? 'Bad request' : 'Internal server error';
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err?.statusCode || err?.status || 500;

  // Full detail, including the stack, is logged server side only.
  console.error(`Error: ${req.method} ${req.originalUrl} -> ${statusCode}`, err);

  // Nothing useful we can do once the response has started; Express's built-in
  // handler takes over from here (it is forced to production mode in server.ts).
  if (res.headersSent) {
    return next(err);
  }

  const isAppError = err instanceof AppError;

  res.status(statusCode).json({
    success: false,
    error: clientMessage(err, statusCode),
    ...(isAppError && err.code && { code: err.code }),
    // Local development only - never reachable unless NODE_ENV is literally
    // 'development'. See config/environment.ts.
    ...(isDevelopment() && {
      detail: err?.message,
      stack: err?.stack,
    }),
  });
};
