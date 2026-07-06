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
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
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
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED', statusCode: 401 });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== 'admin') {
    res.status(403).json({ message: 'Admin access required', code: 'FORBIDDEN', statusCode: 403 });
    return;
  }
  next();
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });
}
