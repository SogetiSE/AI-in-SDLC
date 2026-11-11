import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../models/prisma.js';

// In production, JWT_SECRET must be set as an environment variable.
// The fallback is only used for local development and testing.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const JWT_SECRET = process.env.JWT_SECRET || 'zava-dev-secret';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED', statusCode: 401 });
    return;
  }

  const token = authHeader.slice(7);
  let payload: { userId: string; role: string };
  try {
    payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch (err) {
    // Only token problems are a 401. TokenExpiredError and NotBeforeError extend JsonWebTokenError.
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED', statusCode: 401 });
      return;
    }
    next(err);
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED', statusCode: 401 });
      return;
    }

    req.userId = payload.userId;
    req.userRole = user.role;
  } catch (err) {
    // A DB failure is not an auth failure: surface it as a logged 500, not a silent 401.
    next(err);
    return;
  }
  next();
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });
}
