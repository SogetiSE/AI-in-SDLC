import { Router, Response } from 'express';
import { z } from 'zod';
import type { Cart as CartResponse } from '@zava/shared';
import { prisma } from '../models/prisma.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { logEvent } from '../lib/log.js';
import { priceCart } from '../services/pricing.js';

export const cartRouter = Router();

// All cart routes require authentication
cartRouter.use(authenticate);

const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
});

const cartInclude = {
  items: { include: { product: true } },
  cartDiscount: { include: { discountCode: true } },
} as const;

async function findOrCreateCartId(userId: string): Promise<string> {
  const existing = await prisma.cart.findFirst({ where: { userId }, select: { id: true } });
  if (existing) return existing.id;
  const created = await prisma.cart.create({ data: { userId }, select: { id: true } });
  return created.id;
}

/**
 * Loads a cart and prices it. The single place every cart response is built from.
 * An applied code that has since been deactivated is dropped here, so no cart route
 * ever prices with it.
 */
async function loadPricedCart(cartId: string): Promise<CartResponse> {
  const cart = await prisma.cart.findUniqueOrThrow({ where: { id: cartId }, include: cartInclude });

  let applied = cart.cartDiscount;
  if (applied && !applied.discountCode.active) {
    await prisma.cartDiscount.deleteMany({ where: { id: applied.id } });
    logEvent('discount.dropped', {
      reason: 'inactive',
      cartId: cart.id,
      userId: cart.userId,
      code: applied.discountCode.code,
    });
    applied = null;
  }

  const priced = priceCart(
    cart.items.map((item) => ({ quantity: item.quantity, price: item.product.price })),
    applied ? [{ code: applied.discountCode.code, percentOff: applied.discountCode.percentOff }] : [],
  );

  // Built explicitly (never spread from Prisma) so internal fields such as
  // discountCodeId, appliedAt or active never reach the client.
  return {
    id: cart.id,
    userId: cart.userId,
    items: cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        imageUrl: item.product.imageUrl,
      },
    })),
    subtotal: priced.subtotal,
    discount: priced.discount,
    total: priced.total,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  };
}

// GET /api/cart — get current user's cart
cartRouter.get('/', asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const cartId = await findOrCreateCartId(req.userId!);
  res.json(await loadPricedCart(cartId));
}));

// POST /api/cart/items — add item to cart
cartRouter.post('/items', validate(addItemSchema), asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { productId, quantity } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    res.status(404).json({ message: 'Product not found', code: 'NOT_FOUND', statusCode: 404 });
    return;
  }

  if (product.stock < quantity) {
    res.status(400).json({ message: 'Insufficient stock', code: 'BAD_REQUEST', statusCode: 400 });
    return;
  }

  const cartId = await findOrCreateCartId(req.userId!);

  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId, productId },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId, productId, quantity },
    });
  }

  res.json(await loadPricedCart(cartId));
}));

// DELETE /api/cart/items/:itemId — remove item from cart
cartRouter.delete('/items/:itemId', asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const item = await prisma.cartItem.findUnique({
    where: { id: req.params.itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== req.userId) {
    res.status(404).json({ message: 'Cart item not found', code: 'NOT_FOUND', statusCode: 404 });
    return;
  }

  await prisma.cartItem.delete({ where: { id: req.params.itemId } });
  res.status(204).send();
}));
