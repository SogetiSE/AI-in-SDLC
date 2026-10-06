import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../models/prisma.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

export const cartRouter = Router();

// All cart routes require authentication
cartRouter.use(authenticate);

const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
});

// GET /api/cart — get current user's cart
cartRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  let cart = await prisma.cart.findFirst({
    where: { userId: req.userId! },
    include: { items: { include: { product: true } } },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: req.userId! },
      include: { items: { include: { product: true } } },
    });
  }

  const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  res.json({ ...cart, total });
});

// POST /api/cart/items — add item to cart
cartRouter.post(
  '/items',
  validate(addItemSchema),
  async (req: AuthenticatedRequest, res: Response) => {
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

    let cart = await prisma.cart.findFirst({ where: { userId: req.userId! } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.userId! } });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    const updatedCart = await prisma.cart.findFirst({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });

    const total = updatedCart!.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    res.json({ ...updatedCart, total });
  },
);

// DELETE /api/cart/items/:itemId — remove item from cart
cartRouter.delete('/items/:itemId', async (req: AuthenticatedRequest, res: Response) => {
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
});
