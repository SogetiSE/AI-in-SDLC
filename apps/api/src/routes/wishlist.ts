import { Prisma } from '@prisma/client';
import { Router, Response } from 'express';
import { z } from 'zod';
import { WishlistEntry, WISHLIST_HTTP_STATUS } from '@zava/shared';
import { AuthenticatedRequest, authenticate } from '../middleware/auth.js';
import { prisma } from '../models/prisma.js';

export const wishlistRouter = Router();

const addWishlistSchema = z.object({
  productId: z.string().min(1),
});

const productSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  category: true,
  stock: true,
} as const;

const entryInclude = { product: { select: productSelect } } as const;

function sendError(res: Response, status: number, error: string, message: string): void {
  res.status(status).json({ error, message });
}

function toWishlistEntry(entry: {
  id: string;
  productId: string;
  createdAt: Date;
  product: WishlistEntry['product'];
}): WishlistEntry {
  return {
    id: entry.id,
    productId: entry.productId,
    createdAt: entry.createdAt.toISOString(),
    product: entry.product,
  };
}

function isKnownRequestError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

wishlistRouter.use(authenticate);

wishlistRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entries = await prisma.wishlist.findMany({
      where: { userId: req.userId! },
      include: entryInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.status(WISHLIST_HTTP_STATUS.list).json({ data: entries.map(toWishlistEntry) });
  } catch {
    sendError(
      res,
      WISHLIST_HTTP_STATUS.error.internalServerError,
      'Internal Server Error',
      'Unable to retrieve wishlist',
    );
  }
});

wishlistRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parsed = addWishlistSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, WISHLIST_HTTP_STATUS.error.badRequest, 'Bad Request', 'Invalid wishlist request');
    return;
  }

  const userId = req.userId!;
  const { productId } = parsed.data;

  try {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      sendError(res, WISHLIST_HTTP_STATUS.error.notFound, 'Not Found', 'Product not found');
      return;
    }

    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
      include: entryInclude,
    });
    if (existing) {
      res.status(WISHLIST_HTTP_STATUS.add.duplicate).json({ data: toWishlistEntry(existing) });
      return;
    }

    const entry = await prisma.wishlist.create({
      data: { userId, productId },
      include: entryInclude,
    });
    res.status(WISHLIST_HTTP_STATUS.add.created).json({ data: toWishlistEntry(entry) });
  } catch (error) {
    if (isKnownRequestError(error, 'P2002')) {
      try {
        const existing = await prisma.wishlist.findUnique({
          where: { userId_productId: { userId, productId } },
          include: entryInclude,
        });
        if (existing) {
          res.status(WISHLIST_HTTP_STATUS.add.duplicate).json({ data: toWishlistEntry(existing) });
          return;
        }
      } catch {
        // A failed verification is not evidence that this pair already exists.
      }
    }

    if (isKnownRequestError(error, 'P2003')) {
      sendError(res, WISHLIST_HTTP_STATUS.error.notFound, 'Not Found', 'Product not found');
      return;
    }

    sendError(
      res,
      WISHLIST_HTTP_STATUS.error.internalServerError,
      'Internal Server Error',
      'Unable to update wishlist',
    );
  }
});

wishlistRouter.delete('/:productId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parsedProductId = z.string().min(1).safeParse(req.params.productId);
  if (!parsedProductId.success) {
    sendError(res, WISHLIST_HTTP_STATUS.error.badRequest, 'Bad Request', 'Invalid product ID');
    return;
  }

  try {
    await prisma.wishlist.delete({
      where: {
        userId_productId: { userId: req.userId!, productId: parsedProductId.data },
      },
    });
    res.status(WISHLIST_HTTP_STATUS.delete).send();
  } catch (error) {
    if (isKnownRequestError(error, 'P2025') || isKnownRequestError(error, 'P2003')) {
      sendError(
        res,
        WISHLIST_HTTP_STATUS.error.notFound,
        'Not Found',
        'Wishlist entry not found',
      );
      return;
    }

    sendError(
      res,
      WISHLIST_HTTP_STATUS.error.internalServerError,
      'Internal Server Error',
      'Unable to update wishlist',
    );
  }
});