import { Request, Response, NextFunction } from 'express';
import { logError } from '../lib/log.js';
import type { AuthenticatedRequest } from './auth.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logError('http.error', {
    method: req.method,
    path: req.originalUrl.split('?')[0],
    userId: (req as AuthenticatedRequest).userId,
    message: err.message,
  });
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  });
}
