# API Reference

Base URL: `http://localhost:3001/api`

## Health

### `GET /api/health`

Returns server status.

**Response** `200`

```json
{ "status": "ok", "timestamp": "2025-01-15T10:00:00.000Z" }
```

---

## Products

### `GET /api/products`

List all products. Supports optional `?category=` filter.

**Response** `200`

```json
{
  "data": [
    { "id": "...", "name": "Zava Espresso Blend", "price": 1899, "category": "Coffee", ... }
  ]
}
```

### `GET /api/products/:id`

Get a single product by ID.

**Response** `200` — Product object  
**Response** `404` — `{ "error": "Product not found" }`

### `GET /api/products/categories/list`

List distinct product categories.

**Response** `200`

```json
{ "data": ["Coffee", "Accessories", "Merchandise"] }
```

---

## Auth

### `POST /api/auth/register`

Create a new user account.

**Body**

```json
{ "email": "user@example.com", "name": "Jane", "password": "securePass123" }
```

**Response** `201` — `{ "token": "jwt...", "user": { "id", "email", "name", "role" } }`  
**Response** `400` — Validation error  
**Response** `409` — Email already exists

### `POST /api/auth/login`

Authenticate an existing user.

**Body**

```json
{ "email": "user@example.com", "password": "securePass123" }
```

**Response** `200` — `{ "token": "jwt...", "user": { ... } }`  
**Response** `401` — Invalid credentials

---

## Cart (requires `Authorization: Bearer <token>`)

### `GET /api/cart`

Get the current user's cart with items.

**Response** `200`

```json
{
  "data": {
    "id": "...",
    "items": [
      { "id": "...", "quantity": 2, "product": { "id", "name", "price", "imageUrl" } }
    ]
  }
}
```

### `POST /api/cart/items`

Add a product to the cart (or increment quantity if it already exists).

**Body**

```json
{ "productId": "clx...", "quantity": 1 }
```

**Response** `200` — Updated cart

### `DELETE /api/cart/items/:itemId`

Remove an item from the cart.

**Response** `200` — Updated cart  
**Response** `404` — Item not found
