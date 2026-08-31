import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../app.js';
import { prisma } from '../models/prisma.js';

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('zava-api');
  });
});

describe('Products API', () => {
  beforeAll(async () => {
    await prisma.review.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();
    await prisma.product.createMany({
      data: [
        { name: 'Test Sneakers', description: 'Test shoes', price: 9999, imageUrl: 'https://example.com/shoe.jpg', category: 'Footwear', stock: 10 },
        { name: 'Test Jacket', description: 'Test jacket', price: 14999, imageUrl: 'https://example.com/jacket.jpg', category: 'Outerwear', stock: 5 },
        { name: 'Test Hat', description: 'Test hat', price: 2499, imageUrl: 'https://example.com/hat.jpg', category: 'Accessories', stock: 20 },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/products returns all products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.total).toBe(3);
  });

  it('GET /api/products?category=Footwear filters by category', async () => {
    const res = await request(app).get('/api/products?category=Footwear');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Test Sneakers');
  });

  it('GET /api/products/:id returns a single product', async () => {
    const all = await request(app).get('/api/products');
    const id = all.body.data[0].id;

    const res = await request(app).get(`/api/products/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });

  it('GET /api/products/:id returns 404 for missing product', async () => {
    const res = await request(app).get('/api/products/nonexistent-id');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('GET /api/products/categories/list returns unique categories', async () => {
    const res = await request(app).get('/api/products/categories/list');
    expect(res.status).toBe(200);
    expect(res.body.data).toContain('Footwear');
    expect(res.body.data).toContain('Outerwear');
    expect(res.body.data).toContain('Accessories');
  });
});

describe('Auth API', () => {
  beforeAll(async () => {
    await prisma.review.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.user.deleteMany();
  });

  it('POST /api/auth/register creates a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@zava.com',
      password: 'TestPass123',
      name: 'Test User',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@zava.com');
  });

  it('POST /api/auth/register rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@zava.com',
      password: 'TestPass123',
      name: 'Test User 2',
    });
    expect(res.status).toBe(409);
  });

  it('POST /api/auth/login returns token for valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@zava.com',
      password: 'TestPass123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/auth/login rejects invalid password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@zava.com',
      password: 'WrongPassword',
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/register validates input', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'short',
      name: '',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('Cart API', () => {
  let token: string;
  let productId: string;

  beforeAll(async () => {
    // Register a user and get a token
    const regRes = await request(app).post('/api/auth/register').send({
      email: 'cart-user@zava.com',
      password: 'CartPass123',
      name: 'Cart Tester',
    });
    token = regRes.body.token;

    // Get a product ID
    const prodRes = await request(app).get('/api/products');
    productId = prodRes.body.data[0].id;
  });

  it('GET /api/cart requires auth', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  it('GET /api/cart returns empty cart for new user', async () => {
    const res = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it('POST /api/cart/items adds an item to the cart', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 2 });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('POST /api/cart/items increments quantity for existing item', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 1 });
    expect(res.status).toBe(200);
    expect(res.body.items[0].quantity).toBe(3);
  });

  it('DELETE /api/cart/items/:itemId removes item', async () => {
    const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    const itemId = cart.body.items[0].id;

    const res = await request(app)
      .delete(`/api/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});

describe('Reviews API', () => {
  let customerToken: string;
  let adminToken: string;
  let productId: string;
  let reviewId: string;

  beforeAll(async () => {
    await prisma.review.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    // Create admin
    const adminPass = await bcrypt.hash('Admin123!', 10);
    await prisma.user.create({
      data: { email: 'admin-review@zava.com', password: adminPass, name: 'Admin', role: 'admin' },
    });
    const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin-review@zava.com', password: 'Admin123!' });
    adminToken = adminLogin.body.token;

    // Create customer
    const custRes = await request(app).post('/api/auth/register').send({
      email: 'review-customer@zava.com',
      password: 'CustPass123',
      name: 'Review Customer',
    });
    customerToken = custRes.body.token;

    // Create product
    const product = await prisma.product.create({
      data: { name: 'Review Test Product', description: 'A product for testing reviews', price: 1500, imageUrl: '/img.svg', category: 'Test', stock: 10 },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/reviews requires authentication', async () => {
    const res = await request(app).post('/api/reviews').send({ productId, rating: 5, text: 'Great product for testing' });
    expect(res.status).toBe(401);
  });

  it('POST /api/reviews validates rating range', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId, rating: 6, text: 'This rating is too high for the system' });
    expect(res.status).toBe(400);
  });

  it('POST /api/reviews validates text length', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId, rating: 4, text: 'Short' });
    expect(res.status).toBe(400);
  });

  it('POST /api/reviews creates a review', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId, rating: 5, text: 'Absolutely love this product, highly recommend!' });
    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(5);
    expect(res.body.status).toBe('pending');
    reviewId = res.body.id;
  });

  it('POST /api/reviews rejects duplicate review', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId, rating: 3, text: 'Trying to submit a second review for the same product' });
    expect(res.status).toBe(409);
  });

  it('POST /api/reviews returns 404 for non-existent product', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: 'nonexistent-id', rating: 4, text: 'This product does not exist in the database' });
    expect(res.status).toBe(404);
  });

  it('GET /api/reviews/product/:id returns only approved reviews', async () => {
    const res = await request(app).get(`/api/reviews/product/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0); // review is still pending
    expect(res.body.aggregate.reviewCount).toBe(0);
  });

  it('GET /api/admin/reviews requires admin role', async () => {
    const res = await request(app).get('/api/admin/reviews').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/admin/reviews lists reviews for admin', async () => {
    const res = await request(app).get('/api/admin/reviews').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('PATCH /api/admin/reviews/:id requires admin role', async () => {
    const res = await request(app)
      .patch(`/api/admin/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(403);
  });

  it('PATCH /api/admin/reviews/:id approves a review', async () => {
    const res = await request(app)
      .patch(`/api/admin/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
  });

  it('GET /api/reviews/product/:id returns approved reviews with aggregate', async () => {
    const res = await request(app).get(`/api/reviews/product/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.aggregate.averageRating).toBe(5);
    expect(res.body.aggregate.reviewCount).toBe(1);
  });

  it('GET /api/products returns products with rating data', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    const product = res.body.data.find((p: any) => p.id === productId);
    expect(product.rating).toBeDefined();
    expect(product.rating.averageRating).toBe(5);
    expect(product.rating.reviewCount).toBe(1);
  });
});

describe('Review text validation', () => {
  const MIN_TEXT_LENGTH = 10;
  const MAX_TEXT_LENGTH = 2000;

  let productId: string;
  let userCounter = 0;

  async function registerFreshUser(): Promise<string> {
    userCounter += 1;
    const res = await request(app).post('/api/auth/register').send({
      email: `text-validation-${userCounter}@zava.com`,
      password: 'TextPass123',
      name: `Text Validator ${userCounter}`,
    });
    return res.body.token;
  }

  async function submitReview(text: string): Promise<request.Response> {
    const token = await registerFreshUser();
    return request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, rating: 4, text });
  }

  beforeAll(async () => {
    await prisma.review.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();

    const product = await prisma.product.create({
      data: {
        name: 'Text Validation Product',
        description: 'A product used for review text validation tests',
        price: 2500,
        imageUrl: '/img.svg',
        category: 'Test',
        stock: 10,
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rejects text shorter than 10 characters with 400', async () => {
    const res = await submitReview('a'.repeat(MIN_TEXT_LENGTH - 1));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.text).toBeDefined();
  });

  it('accepts text of exactly 2000 characters', async () => {
    const res = await submitReview('a'.repeat(MAX_TEXT_LENGTH));
    expect(res.status).toBe(201);
    expect(res.body.text).toHaveLength(MAX_TEXT_LENGTH);
  });

  it('rejects text longer than 2000 characters with 400', async () => {
    const res = await submitReview('a'.repeat(MAX_TEXT_LENGTH + 1));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.text).toBeDefined();
  });

  it('accepts text of 1500 characters', async () => {
    const res = await submitReview('a'.repeat(1500));
    expect(res.status).toBe(201);
    expect(res.body.text).toHaveLength(1500);
  });

  it('rejects text containing a script tag with 400', async () => {
    const res = await submitReview('Great product <script>alert(1)</script> really loved it');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.text).toBeDefined();
  });

  it('rejects text containing a bold tag with 400', async () => {
    const res = await submitReview('This product is <b>bold</b> and very comfortable');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.text).toBeDefined();
  });

  it('rejects text containing an img tag with 400', async () => {
    const res = await submitReview('Nice product <img src=x onerror=y> would buy again');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.text).toBeDefined();
  });
});
