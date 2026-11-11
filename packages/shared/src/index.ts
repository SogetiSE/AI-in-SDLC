// Types
export type { Product, CreateProductInput } from './types/product.js';
export type { Cart, CartItem, AddToCartInput, AppliedDiscount, ApplyDiscountInput } from './types/cart.js';
export type { User, LoginInput, RegisterInput, AuthResponse } from './types/user.js';
export type { ApiError, PaginatedResponse } from './types/api.js';

// Utils
export { formatPrice } from './utils/formatting.js';
