import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../models/prisma.js';

// Note: vi.spyOn does not work on Prisma model methods. The delegates are proxies,
// so the spy captures the wrong "original": restoring leaves the method undefined
// and passing through returns undefined. overrideOnce() reads the real method with
// a normal property access, replaces it for exactly one call, then puts it back.
type Overridable = Record<string, unknown>;
const overrides: Array<() => void> = [];
function overrideOnce(delegate: object, method: string, impl: (...args: unknown[]) => unknown) {
  const target = delegate as Overridable;
  const original = target[method];
  const restore = () => {
    target[method] = original;
  };
  const fake = vi.fn((...args: unknown[]) => {
    restore();
    return impl(...args);
  });
  target[method] = fake;
  overrides.push(restore);
  return fake;
}
function failOnce(delegate: object, method: string) {
  return overrideOnce(delegate, method, () => Promise.reject(new Error('db down')));
}
function restoreOverrides() {
  while (overrides.length) overrides.pop()!();
}

const consoleSpies: Array<{ mockRestore: () => void }> = [];
function spyConsole(method: 'info' | 'error') {
  const spy = vi.spyOn(console, method).mockImplementation(() => {});
  consoleSpies.push(spy);
  return spy;
}
function restoreConsoleSpies() {
  while (consoleSpies.length) consoleSpies.pop()!.mockRestore();
}
function loggedEvents(spy: ReturnType<typeof spyConsole>) {
  return (spy as unknown as { mock: { calls: unknown[][] } }).mock.calls
    .map((c) => {
      try {
        return JSON.parse(String(c[0]));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

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
    expect(res.body.subtotal).toBe(0);
    expect(res.body.discount).toBeNull();
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

  it('POST /api/cart/items → 404 for unknown product', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 'nonexistent-id', quantity: 1 });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('POST /api/cart/items → 400 when quantity > stock', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 9999 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Insufficient stock');
  });

  it("DELETE another user's item → 404 and item still exists", async () => {
    const added = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 1 });
    const itemId = added.body.items[0].id;

    const other = await request(app).post('/api/auth/register').send({
      email: 'cart-intruder@zava.com',
      password: 'IntruderPass123',
      name: 'Intruder',
    });

    const res = await request(app)
      .delete(`/api/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${other.body.token}`);
    expect(res.status).toBe(404);
    expect(await prisma.cartItem.findUnique({ where: { id: itemId } })).not.toBeNull();
  });
});

describe('Cart errors', () => {
  let token: string;
  let userId: string;
  let productId: string;
  const unhandled = vi.fn();
  const onUnhandled = (reason: unknown) => unhandled(reason);

  beforeAll(async () => {
    process.on('unhandledRejection', onUnhandled);
    const reg = await request(app).post('/api/auth/register').send({
      email: 'errors-user@zava.com',
      password: 'ErrorsPass123',
      name: 'Errors Tester',
    });
    token = reg.body.token;
    userId = reg.body.user.id;
    const prods = await request(app).get('/api/products');
    productId = prods.body.data[0].id;
  });

  afterAll(() => {
    process.off('unhandledRejection', onUnhandled);
  });

  afterEach(() => {
    restoreConsoleSpies();
    restoreOverrides();
    expect(unhandled).not.toHaveBeenCalled();
  });

  function expectHttpErrorLogged(errorSpy: ReturnType<typeof spyConsole>, method: string, path: string, uid?: string) {
    expect(loggedEvents(errorSpy)).toContainEqual(
      expect.objectContaining({ event: 'http.error', method, path, ...(uid ? { userId: uid } : {}), message: 'db down' }),
    );
  }

  const internalError = { message: 'Internal server error', code: 'INTERNAL_ERROR', statusCode: 500 };

  it('GET /api/cart → 500 INTERNAL_ERROR when prisma throws', async () => {
    const errorSpy = spyConsole('error');
    failOnce(prisma.cart, 'findFirst');
    const res = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body).toEqual(internalError);
    expectHttpErrorLogged(errorSpy, 'GET', '/api/cart', userId);
  });

  it('POST /api/cart/items → 500 when prisma throws', async () => {
    const errorSpy = spyConsole('error');
    failOnce(prisma.product, 'findUnique');
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 1 });
    expect(res.status).toBe(500);
    expectHttpErrorLogged(errorSpy, 'POST', '/api/cart/items', userId);
  });

  it('DELETE /api/cart/items/:id → 500 when prisma throws', async () => {
    const errorSpy = spyConsole('error');
    failOnce(prisma.cartItem, 'findUnique');
    const res = await request(app).delete('/api/cart/items/some-id').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expectHttpErrorLogged(errorSpy, 'DELETE', '/api/cart/items/some-id', userId);
  });

  it("GET /api/cart → 500 when authenticate's user lookup throws", async () => {
    const errorSpy = spyConsole('error');
    failOnce(prisma.user, 'findUnique');
    const res = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expectHttpErrorLogged(errorSpy, 'GET', '/api/cart');
  });

  it('GET /api/cart → still 401 for a bad token', async () => {
    const res = await request(app).get('/api/cart').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/auth/login → 500 when prisma throws', async () => {
    const errorSpy = spyConsole('error');
    failOnce(prisma.user, 'findUnique');
    const res = await request(app).post('/api/auth/login').send({ email: 'errors-user@zava.com', password: 'ErrorsPass123' });
    expect(res.status).toBe(500);
    expectHttpErrorLogged(errorSpy, 'POST', '/api/auth/login');
  });
});

describe('Discount API', () => {
  let token: string;
  let userId: string;
  let productIds: string[];

  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    await prisma.cartDiscount.deleteMany();
    await prisma.discountCode.deleteMany();
    await prisma.discountCode.createMany({
      data: [
        { code: 'WELCOME10', percentOff: 10 },
        { code: 'BREW15', percentOff: 15 },
        { code: 'RETIRED20', percentOff: 20, active: false },
        { code: 'TEMP30', percentOff: 30 },
      ],
    });

    const reg = await request(app).post('/api/auth/register').send({
      email: 'discount-user@zava.com',
      password: 'DiscountPass123',
      name: 'Discount Tester',
    });
    token = reg.body.token;
    userId = reg.body.user.id;

    const prods = await request(app).get('/api/products');
    productIds = prods.body.data.map((p: { id: string }) => p.id);
  });

  afterEach(() => {
    restoreConsoleSpies();
    restoreOverrides();
  });

  async function cartId(): Promise<string> {
    const res = await request(app).get('/api/cart').set(auth());
    return res.body.id;
  }

  async function attach(code: string): Promise<void> {
    const dc = await prisma.discountCode.findUniqueOrThrow({ where: { code } });
    await prisma.cartDiscount.create({ data: { cartId: await cartId(), discountCodeId: dc.id } });
  }

  async function addItem(index: number, quantity = 1) {
    return request(app).post('/api/cart/items').set(auth()).send({ productId: productIds[index], quantity });
  }

  async function priceOf(index: number): Promise<number> {
    return (await prisma.product.findUniqueOrThrow({ where: { id: productIds[index] } })).price;
  }

  beforeEach(async () => {
    const id = await cartId();
    await prisma.cartDiscount.deleteMany({ where: { cartId: id } });
    await prisma.cartItem.deleteMany({ where: { cartId: id } });
    await prisma.discountCode.update({ where: { code: 'TEMP30' }, data: { active: true } });
  });

  it('adding items recalculates discount', async () => {
    await attach('WELCOME10');
    await addItem(0, 2);
    const res = await addItem(1, 1);
    const subtotal = 2 * (await priceOf(0)) + (await priceOf(1));
    expect(res.status).toBe(200);
    expect(res.body.subtotal).toBe(subtotal);
    expect(res.body.discount).toEqual({ code: 'WELCOME10', percentOff: 10, amount: Math.floor(subtotal / 10) });
    expect(res.body.total).toBe(subtotal - Math.floor(subtotal / 10));
  });

  it('removing an item then GET recalculates the discount', async () => {
    await attach('WELCOME10');
    await addItem(0, 1);
    const withTwo = await addItem(1, 1);
    const toRemove = withTwo.body.items.find((i: { productId: string }) => i.productId === productIds[1]).id;
    await request(app).delete(`/api/cart/items/${toRemove}`).set(auth()).expect(204);
    const res = await request(app).get('/api/cart').set(auth());
    const subtotal = await priceOf(0);
    expect(res.body.subtotal).toBe(subtotal);
    expect(res.body.discount.amount).toBe(Math.floor(subtotal / 10));
  });

  it('removing the last item keeps the discount attached (amount 0)', async () => {
    await attach('WELCOME10');
    const added = await addItem(0, 1);
    await request(app).delete(`/api/cart/items/${added.body.items[0].id}`).set(auth()).expect(204);
    const res = await request(app).get('/api/cart').set(auth());
    expect(res.body.items).toHaveLength(0);
    expect(res.body.discount).toEqual({ code: 'WELCOME10', percentOff: 10, amount: 0 });
    expect(res.body.total).toBe(0);
  });

  it('cart response exposes exactly the public fields', async () => {
    await attach('WELCOME10');
    await addItem(0, 1);
    const res = await request(app).get('/api/cart').set(auth());
    expect(Object.keys(res.body).sort()).toEqual(
      ['createdAt', 'discount', 'id', 'items', 'subtotal', 'total', 'updatedAt', 'userId'],
    );
    expect(Object.keys(res.body.discount).sort()).toEqual(['amount', 'code', 'percentOff']);
  });

  it('deactivated code: GET returns discount null and logs discount.dropped', async () => {
    await attach('TEMP30');
    await addItem(0, 1);
    await prisma.discountCode.update({ where: { code: 'TEMP30' }, data: { active: false } });
    const info = spyConsole('info');
    const res = await request(app).get('/api/cart').set(auth());
    expect(res.body.discount).toBeNull();
    expect(res.body.total).toBe(res.body.subtotal);
    expect(await prisma.cartDiscount.count({ where: { cartId: res.body.id } })).toBe(0);
    expect(loggedEvents(info)).toContainEqual(
      expect.objectContaining({ event: 'discount.dropped', reason: 'inactive', code: 'TEMP30', cartId: res.body.id }),
    );
  });

  it('POST /items after deactivation → discount null', async () => {
    await attach('TEMP30');
    await prisma.discountCode.update({ where: { code: 'TEMP30' }, data: { active: false } });
    const res = await addItem(0, 1);
    expect(res.status).toBe(200);
    expect(res.body.discount).toBeNull();
  });

  it('DB rejects a second CartDiscount for the same cart with P2002', async () => {
    const cart = await prisma.cart.create({ data: { userId } });
    const codes = await prisma.discountCode.findMany({ where: { code: { in: ['WELCOME10', 'BREW15'] } } });
    await prisma.cartDiscount.create({ data: { cartId: cart.id, discountCodeId: codes[0].id } });
    await expect(
      prisma.cartDiscount.create({ data: { cartId: cart.id, discountCodeId: codes[1].id } }),
    ).rejects.toMatchObject({ code: 'P2002' });
    await prisma.cart.delete({ where: { id: cart.id } });
    expect(await prisma.cartDiscount.count({ where: { cartId: cart.id } })).toBe(0);
  });
});
