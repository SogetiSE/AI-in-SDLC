import { Link } from 'react-router-dom';
import { formatPrice } from '@zava/shared';
import { useCart } from '../hooks/useCart';
import { CartItemRow } from '../components/CartItemRow';
import { DiscountCodeForm } from '../components/DiscountCodeForm';

export function CartPage() {
  const { cart, loading, removeItem, discountError, discountPending, applyDiscount, removeDiscount } = useCart();

  if (loading) return <div className="loading">Loading cart...</div>;

  const items = cart?.items ?? [];
  const discount = cart?.discount ?? null;

  return (
    <div>
      <h1 className="page-title">Your Cart</h1>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          {discount && (
            <p className="discount-form__applied" style={{ justifyContent: 'center', marginTop: '0.75rem' }}>
              <span>
                <strong>{discount.code}</strong> will apply to your next items
              </span>
              <button
                type="button"
                className="btn btn--secondary discount-form__remove"
                onClick={() => {
                  void removeDiscount();
                }}
                disabled={discountPending}
                aria-label={`Remove discount code ${discount.code}`}
              >
                Remove
              </button>
            </p>
          )}
          <Link to="/" className="btn btn--primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                id={item.id}
                name={item.product.name}
                price={item.product.price}
                quantity={item.quantity}
                imageUrl={item.product.imageUrl}
                onRemove={() => {
                  void removeItem(item.id);
                }}
              />
            ))}
          </div>

          <div
            style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              maxWidth: 400,
              marginLeft: 'auto',
            }}
          >
            <DiscountCodeForm
              discount={discount}
              error={discountError}
              pending={discountPending}
              onApply={(code) => {
                void applyDiscount(code);
              }}
              onRemove={() => {
                void removeDiscount();
              }}
            />
            <div className="cart-summary__row" data-testid="cart-subtotal">
              <span>Subtotal ({items.length} items)</span>
              <span>{formatPrice(cart?.subtotal ?? 0)}</span>
            </div>
            {discount && (
              <div className="cart-summary__row cart-summary__row--discount" data-testid="cart-discount">
                <span>Discount ({discount.code})</span>
                <span>−{formatPrice(discount.amount)}</span>
              </div>
            )}
            <div className="cart-summary__row cart-summary__row--total" data-testid="cart-total">
              <strong>Total</strong>
              <strong>{formatPrice(cart?.total ?? 0)}</strong>
            </div>
            <Link to="/checkout" className="btn btn--primary" style={{ width: '100%' }}>
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
