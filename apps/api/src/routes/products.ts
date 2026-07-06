import { Router, Request, Response } from 'express';
import { prisma } from '../models/prisma.js';

export const productsRouter = Router();


// GET /api/products — list all products
productsRouter.get('/', async (req: Request, res: Response) => {
  const { category } = req.query;

  const where = category ? { category: String(category) } : {};
  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const ratings = await prisma.review.groupBy({
    by: ['productId'],
    where: { status: 'approved' },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const ratingMap = new Map(ratings.map((r) => [r.productId, { averageRating: r._avg.rating ?? 0, reviewCount: r._count.rating }]));

  const data = products.map((p) => ({
    ...p,
    rating: ratingMap.get(p.id) ?? { averageRating: 0, reviewCount: 0 },
  }));

  res.json({ data, total: data.length });
});

// GET /api/products/:id — single product
productsRouter.get('/:id', async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
  });

  if (!product) {
    res.status(404).json({ message: 'Product not found', code: 'NOT_FOUND', statusCode: 404 });
    return;
  }

  const aggregate = await prisma.review.aggregate({
    where: { productId: product.id, status: 'approved' },
    _avg: { rating: true },
    _count: { rating: true },
  });

  res.json({
    ...product,
    rating: {
      averageRating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count.rating,
    },
  });
});

// GET /api/products/categories — list unique categories
productsRouter.get('/categories/list', async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({ select: { category: true }, distinct: ['category'] });
  const categories = products.map((p) => p.category);
  res.json({ data: categories });
});
