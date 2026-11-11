/** A cart line as returned by the API (`GET /api/cart` and friends). */
export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    /** Unit price in cents. */
    price: number;
    imageUrl: string;
  };
}

/** The single discount applied to a cart. All amounts are in cents. */
export interface AppliedDiscount {
  code: string;
  percentOff: number;
  /** Amount taken off the subtotal, in cents. */
  amount: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  /** Sum of item price × quantity, before any discount, in cents. */
  subtotal: number;
  /** The applied discount, or null when none is applied. */
  discount: AppliedDiscount | null;
  /** subtotal − discount.amount, in cents. Shipping is not included. */
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartInput {
  productId: string;
  quantity: number;
}

export interface ApplyDiscountInput {
  code: string;
}
