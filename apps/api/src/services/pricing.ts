import type { AppliedDiscount } from '@zava/shared';

/**
 * The most any discount may take off a cart, in percent. Guards against a
 * mis-configured code giving goods away. Kept in the API (not @zava/shared)
 * because the API must not runtime-import shared (see docs/features/3-discount-codes).
 */
export const MAX_DISCOUNT_PERCENT = 50;

export interface PricedLine {
  quantity: number;
  /** Unit price in cents. */
  price: number;
}

export interface DiscountInput {
  code: string;
  percentOff: number;
}

export interface PricedCart {
  subtotal: number;
  discount: AppliedDiscount | null;
  total: number;
}

/**
 * Prices a cart. The single source of truth for cart totals.
 *
 * Takes a list of discounts so that combinable discounts can be added later;
 * the current policy applies only the first one (one discount per cart).
 * Discounts apply to every item; amounts are floored to whole cents.
 */
export function priceCart(lines: PricedLine[], discounts: DiscountInput[]): PricedCart {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  const [first] = discounts;
  if (!first) {
    return { subtotal, discount: null, total: subtotal };
  }

  const percentOff = Math.min(Math.max(first.percentOff, 0), MAX_DISCOUNT_PERCENT);
  const amount = Math.min(Math.floor((subtotal * percentOff) / 100), subtotal);

  return {
    subtotal,
    discount: { code: first.code, percentOff, amount },
    total: Math.max(subtotal - amount, 0),
  };
}
