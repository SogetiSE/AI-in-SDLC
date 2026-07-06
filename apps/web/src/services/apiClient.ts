const API_BASE = '/api';

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('zava_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(error.message || `HTTP ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Products
  getProducts: (category?: string) =>
    request<{ data: any[]; total: number }>(category ? `/products?category=${category}` : '/products'),

  getProduct: (id: string) => request<any>(`/products/${id}`),

  getCategories: () => request<{ data: string[] }>('/products/categories/list'),

  // Cart
  getCart: () => request<any>('/cart'),

  addToCart: (productId: string, quantity: number) =>
    request<any>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),

  removeFromCart: (itemId: string) =>
    request<void>(`/cart/items/${itemId}`, { method: 'DELETE' }),

  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name: string) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  // Reviews
  getProductReviews: (productId: string, page = 1) =>
    request<{ data: any[]; total: number; page: number; pageSize: number; aggregate: { averageRating: number; reviewCount: number } }>(
      `/reviews/product/${productId}?page=${page}`,
    ),

  submitReview: (data: { productId: string; rating: number; text: string }) =>
    request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin Reviews
  getAdminReviews: (status?: string, page = 1) =>
    request<{ data: any[]; total: number; page: number; pageSize: number }>(
      `/admin/reviews?page=${page}${status ? `&status=${status}` : ''}`,
    ),

  moderateReview: (reviewId: string, status: 'approved' | 'rejected') =>
    request<any>(`/admin/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
