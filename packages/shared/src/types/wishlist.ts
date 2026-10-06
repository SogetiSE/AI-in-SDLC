export interface AddToWishlistInput {
  productId: string;
}

export interface WishlistEntry {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
    stock: number;
  };
}

export interface WishlistListResponse {
  data: WishlistEntry[];
}

export interface WishlistAddResponse {
  data: WishlistEntry;
}

export interface WishlistErrorResponse {
  error: string;
  message: string;
}

export const WISHLIST_HTTP_STATUS = {
  list: 200,
  add: {
    created: 201,
    duplicate: 200,
  },
  delete: 204,
  error: {
    badRequest: 400,
    unauthorized: 401,
    notFound: 404,
    internalServerError: 500,
  },
} as const;
