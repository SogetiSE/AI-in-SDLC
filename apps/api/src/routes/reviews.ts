import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../models/prisma.js';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

export const reviewsRouter = Router();
export const adminReviewsRouter = Router();

const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10).max(1000),
});

const moderateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

// POST /api/reviews — submit a review (authenticated customers)
reviewsRouter.post('/', authenticate, validate(createReviewSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { productId, rating, text } = req.body;
  const userId = req.userId!;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    res.status(404).json({ message: 'Product not found', code: 'NOT_FOUND', statusCode: 404 });
    return;
  }

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
  });
  if (existing) {
    res.status(409).json({ message: 'You have already reviewed this product', code: 'CONFLICT', statusCode: 409 });
    return;
  }

  const review = await prisma.review.create({
    data: { productId, userId, rating, text },
    include: { user: { select: { name: true } } },
  });

  res.status(201).json({
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    userName: review.user.name,
    rating: review.rating,
    text: review.text,
    status: review.status,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  });
});

// GET /api/reviews/product/:productId — list approved reviews for a product
reviewsRouter.get('/product/:productId', async (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10));

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId, status: 'approved' },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.review.count({ where: { productId, status: 'approved' } }),
  ]);

  const aggregate = await prisma.review.aggregate({
    where: { productId, status: 'approved' },
    _avg: { rating: true },
    _count: { rating: true },
  });

  res.json({
    data: reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      userId: r.userId,
      userName: r.user.name,
      rating: r.rating,
      text: r.text,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    total,
    page,
    pageSize,
    aggregate: {
      averageRating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count.rating,
    },
  });
});

// GET /api/admin/reviews — list all reviews (admin only)
adminReviewsRouter.get('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10));

  const where = status ? { status: String(status) } : {};

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { name: true } },
        product: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.review.count({ where }),
  ]);

  res.json({
    data: reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product.name,
      userId: r.userId,
      userName: r.user.name,
      rating: r.rating,
      text: r.text,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    total,
    page,
    pageSize,
  });
});

// PATCH /api/admin/reviews/:id — moderate a review (admin only)
adminReviewsRouter.patch('/:id', authenticate, requireAdmin, validate(moderateReviewSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    res.status(404).json({ message: 'Review not found', code: 'NOT_FOUND', statusCode: 404 });
    return;
  }

  const updated = await prisma.review.update({
    where: { id },
    data: { status },
    include: { user: { select: { name: true } }, product: { select: { name: true } } },
  });

  res.json({
    id: updated.id,
    productId: updated.productId,
    productName: updated.product.name,
    userId: updated.userId,
    userName: updated.user.name,
    rating: updated.rating,
    text: updated.text,
    status: updated.status,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
});
