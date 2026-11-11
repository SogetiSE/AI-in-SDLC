import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Cart } from '@zava/shared';
import { useCart } from '../hooks/useCart';
import { CheckoutPage } from './CheckoutPage';

vi.mock('../hooks/useCart', () => ({ useCart: vi.fn() }));
const mockedUseCart = vi.mocked(useCart);

function cartWith(subtotal: number, discount: Cart['discount']): Cart {
  return {
    id: 'cart-1',
    userId: 'user-1',
    items: [{ id: 'item-1', productId: 'p1', quantity: 1, product: { id: 'p1', name: 'Thing', price: subtotal, imageUrl: '/t.svg' } }],
    subtotal,
    discount,
    total: subtotal - (discount?.amount ?? 0),
    createdAt: '2026-11-11T00:00:00.000Z',
    updatedAt: '2026-11-11T00:00:00.000Z',
  };
}

function renderWith(cart: Cart) {
  mockedUseCart.mockReturnValue({
    cart,
    loading: false,
    error: null,
    itemCount: 1,
    sessionReady: true,
    demoUserName: 'Maya Chen',
    fetchCart: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
    discountError: null,
    discountPending: false,
    applyDiscount: vi.fn(),
    removeDiscount: vi.fn(),
  });
  render(
    <BrowserRouter>
      <CheckoutPage />
    </BrowserRouter>,
  );
}

describe('CheckoutPage', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows "Discount (WELCOME10)" and Place Order = cart.total + shipping', () => {
    // subtotal $50.00, 10% off → $45.00, plus $8.95 shipping
    renderWith(cartWith(5000, { code: 'WELCOME10', percentOff: 10, amount: 500 }));
    expect(screen.getByText('Discount (WELCOME10)')).toBeInTheDocument();
    expect(screen.getByText('−$5.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Place Order/ })).toHaveTextContent('Place Order — $53.95');
  });

  it('subtotal 7600 with 10% off (total 6840) still ships free', () => {
    renderWith(cartWith(7600, { code: 'WELCOME10', percentOff: 10, amount: 760 }));
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Place Order/ })).toHaveTextContent('Place Order — $68.40');
  });

  it('subtotal 5000 without discount → $8.95 shipping', () => {
    renderWith(cartWith(5000, null));
    expect(screen.getByText('$8.95')).toBeInTheDocument();
    expect(screen.queryByText(/Discount \(/)).toBeNull();
    expect(screen.getByRole('button', { name: /Place Order/ })).toHaveTextContent('Place Order — $58.95');
  });
});
