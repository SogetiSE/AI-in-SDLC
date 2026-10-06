import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '@zava/shared';
import { useCart } from '../hooks/useCart';

export function CheckoutPage(): JSX.Element {
  const { cart, loading } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);

  if (loading) return <div className="loading">Loading...</div>;

  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const shipping = subtotal >= 7500 ? 0 : 895;
  const total = subtotal + shipping;

  if (orderPlaced) {
    return (
      <div className="checkout">
        <div className="checkout__confirmation">
          <div className="checkout__check-icon">✓</div>
          <h1 className="page-title">Order Confirmed</h1>
          <p className="checkout__confirmation-text">
            Thank you for your order! We&apos;ll send a confirmation email with tracking details
            shortly.
          </p>
          <Link to="/" className="btn btn--primary" style={{ marginTop: '1.5rem' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>Your cart is empty. Add some items before checking out.</p>
        <Link
          to="/"
          className="btn btn--primary"
          style={{ marginTop: '1rem', display: 'inline-block' }}
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout">
      <Link to="/cart" className="product-detail__backlink">
        ← Back to Cart
      </Link>
      <h1 className="page-title" style={{ marginTop: '1rem' }}>
        Checkout
      </h1>

      <div className="checkout__layout">
        <div className="checkout__form-section">
          <div className="checkout__section">
            <h2 className="checkout__section-title">Contact Information</h2>
            <div className="checkout__field">
              <label className="checkout__label" htmlFor="email">
                Email
              </label>
              <input
                className="checkout__input"
                id="email"
                type="email"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="checkout__section">
            <h2 className="checkout__section-title">Shipping Address</h2>
            <div className="checkout__row">
              <div className="checkout__field">
                <label className="checkout__label" htmlFor="firstName">
                  First Name
                </label>
                <input
                  className="checkout__input"
                  id="firstName"
                  type="text"
                  placeholder="First name"
                />
              </div>
              <div className="checkout__field">
                <label className="checkout__label" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  className="checkout__input"
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="checkout__field">
              <label className="checkout__label" htmlFor="address">
                Address
              </label>
              <input
                className="checkout__input"
                id="address"
                type="text"
                placeholder="Street address"
              />
            </div>
            <div className="checkout__row">
              <div className="checkout__field">
                <label className="checkout__label" htmlFor="city">
                  City
                </label>
                <input className="checkout__input" id="city" type="text" placeholder="City" />
              </div>
              <div className="checkout__field">
                <label className="checkout__label" htmlFor="state">
                  State
                </label>
                <input className="checkout__input" id="state" type="text" placeholder="State" />
              </div>
              <div className="checkout__field">
                <label className="checkout__label" htmlFor="zip">
                  ZIP Code
                </label>
                <input className="checkout__input" id="zip" type="text" placeholder="ZIP" />
              </div>
            </div>
          </div>

          <div className="checkout__section">
            <h2 className="checkout__section-title">Payment</h2>
            <div className="checkout__field">
              <label className="checkout__label" htmlFor="cardNumber">
                Card Number
              </label>
              <input
                className="checkout__input"
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div className="checkout__row">
              <div className="checkout__field">
                <label className="checkout__label" htmlFor="expiry">
                  Expiry
                </label>
                <input className="checkout__input" id="expiry" type="text" placeholder="MM / YY" />
              </div>
              <div className="checkout__field">
                <label className="checkout__label" htmlFor="cvc">
                  CVC
                </label>
                <input className="checkout__input" id="cvc" type="text" placeholder="123" />
              </div>
            </div>
          </div>

          <button
            className="btn btn--primary btn--full"
            style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', marginTop: '0.5rem' }}
            onClick={() => setOrderPlaced(true)}
          >
            Place Order — {formatPrice(total)}
          </button>
        </div>

        <div className="checkout__summary">
          <h2 className="checkout__section-title">Order Summary</h2>
          <div className="checkout__items">
            {items.map((item) => (
              <div key={item.id} className="checkout__item">
                <img
                  className="checkout__item-image"
                  src={item.product.imageUrl}
                  alt={item.product.name}
                />
                <div className="checkout__item-info">
                  <div className="checkout__item-name">{item.product.name}</div>
                  <div className="checkout__item-qty">Qty: {item.quantity}</div>
                </div>
                <div className="checkout__item-price">
                  {formatPrice(item.product.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          <div className="checkout__totals">
            <div className="checkout__total-row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="checkout__total-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
            <div className="checkout__total-row checkout__total-row--final">
              <strong>Total</strong>
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
