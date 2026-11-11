import { describe, it, expect } from 'vitest';
import { priceCart, MAX_DISCOUNT_PERCENT } from './pricing.js';

const items = [
  { quantity: 2, price: 1899, category: 'Coffee' },
  { quantity: 1, price: 9200, category: 'Brewing Gear' },
  { quantity: 1, price: 3600, category: 'Home Ritual' },
];
// 3798 + 9200 + 3600
const subtotal = 16598;

describe('priceCart', () => {
  it('no discount → total = subtotal', () => {
    expect(priceCart(items, [])).toEqual({ subtotal, discount: null, total: subtotal });
  });

  it('applies percent to all items across categories', () => {
    const priced = priceCart(items, [{ code: 'WELCOME10', percentOff: 10 }]);
    expect(priced.discount).toEqual({ code: 'WELCOME10', percentOff: 10, amount: 1659 });
    expect(priced.total).toBe(subtotal - 1659);
  });

  it('floors to whole cents', () => {
    // 15% of 1899 = 284.85 → 284
    const priced = priceCart([{ quantity: 1, price: 1899 }], [{ code: 'BREW15', percentOff: 15 }]);
    expect(priced.discount?.amount).toBe(284);
    expect(priced.total).toBe(1615);
  });

  it(`caps at ${MAX_DISCOUNT_PERCENT}%`, () => {
    const priced = priceCart(items, [{ code: 'FREE100', percentOff: 100 }]);
    expect(priced.discount).toEqual({ code: 'FREE100', percentOff: 50, amount: 8299 });
    expect(priced.total).toBe(subtotal - 8299);
  });

  it('percentOff ≤ 0 → discount 0', () => {
    const priced = priceCart(items, [{ code: 'NEG', percentOff: -20 }]);
    expect(priced.discount?.amount).toBe(0);
    expect(priced.total).toBe(subtotal);
  });

  it('never below 0 (empty cart)', () => {
    const priced = priceCart([], [{ code: 'WELCOME10', percentOff: 10 }]);
    expect(priced).toEqual({ subtotal: 0, discount: { code: 'WELCOME10', percentOff: 10, amount: 0 }, total: 0 });
  });

  it('uses only the first discount (single-discount policy)', () => {
    const priced = priceCart(items, [
      { code: 'WELCOME10', percentOff: 10 },
      { code: 'BREW15', percentOff: 15 },
    ]);
    expect(priced.discount?.code).toBe('WELCOME10');
    expect(priced.total).toBe(subtotal - 1659);
  });
});
