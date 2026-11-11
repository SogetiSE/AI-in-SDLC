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

All cart responses share one shape. It is **not** wrapped in `data`. Amounts are in cents and
computed by the server; `total` is `subtotal − discount.amount` and excludes shipping.

```json
{
  "id": "...",
  "userId": "...",
  "items": [
    { "id": "...", "productId": "...", "quantity": 2, "product": { "id": "...", "name": "...", "price": 1899, "imageUrl": "..." } }
  ],
  "subtotal": 3798,
  "discount": { "code": "WELCOME10", "percentOff": 10, "amount": 379 },
  "total": 3419,
  "createdAt": "2026-11-11T00:00:00.000Z",
  "updatedAt": "2026-11-11T00:00:00.000Z"
}
```

`discount` is `null` when no code is applied. An applied code that has since been deactivated is
dropped by the next cart response.

### `GET /api/cart`
Get the current user's cart (created on first access).

**Response** `200` — Cart

### `POST /api/cart/items`
Add a product to the cart (or increment quantity if it already exists).

**Body**
```json
{ "productId": "clx...", "quantity": 1 }
```

**Response** `200` — Updated cart  
**Response** `400` — `VALIDATION_ERROR`, or `BAD_REQUEST` "Insufficient stock"  
**Response** `404` — `NOT_FOUND` Product not found

### `DELETE /api/cart/items/:itemId`
Remove an item from the cart. Re-fetch the cart to get the new totals.

**Response** `204` — No content  
**Response** `404` — Item not found (also for another user's item)

### `POST /api/cart/discount`
Apply a percentage discount code to the whole cart. Codes match case-insensitively after trimming.
Only one code can be applied per cart; any discount is capped at 50% of the subtotal.

**Body**
```json
{ "code": "WELCOME10" }
```

**Response** `200` — Updated cart (also when the same code is already applied)  
**Response** `400` — `VALIDATION_ERROR` (missing, empty or longer than 32 characters)  
**Response** `404` — `DISCOUNT_NOT_FOUND` "This discount code is not valid." (unknown or inactive)  
**Response** `409` — `DISCOUNT_ALREADY_APPLIED` "Only one discount code can be used per order. Remove WELCOME10 to use a different code."

### `DELETE /api/cart/discount`
Remove the applied discount code. Idempotent.

**Response** `200` — Updated cart with `discount: null`

### Errors

Errors use `{ "message", "code", "statusCode" }`. Unexpected failures return `500`
`INTERNAL_ERROR` and log one JSON line `{"event":"http.error","method","path","userId","message"}`.
Discount outcomes log `discount.applied`, `discount.rejected` (`reason`: `not_found` or
`already_applied`), `discount.removed` and `discount.dropped`.
