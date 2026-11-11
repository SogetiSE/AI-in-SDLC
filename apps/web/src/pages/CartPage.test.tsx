import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Cart } from '@zava/shared';
import { useCart } from '../hooks/useCart';
import { CartPage } from './CartPage';

vi.mock('../hooks/useCart', () => ({ useCart: vi.fn() }));
const mockedUseCart = vi.mocked(useCart);

type CartContextValue = ReturnType<typeof useCart>;

const items: Cart['items'] = [
  { id: 'item-1', productId: 'p1', quantity: 1, product: { id: 'p1', name: 'Atlas Espresso', price: 1899, imageUrl: '/a.svg' } },
  { id: 'item-2', productId: 'p2', quantity: 1, product: { id: 'p2', name: 'Copper Kettle', price: 9200, imageUrl: '/k.svg' } },
];

function makeCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: 'cart-1',
    userId: 'user-1',
    items,
    subtotal: 11099,
    discount: { code: 'WELCOME10', percentOff: 10, amount: 1109 },
    total: 9990,
    createdAt: '2026-11-11T00:00:00.000Z',
    updatedAt: '2026-11-11T00:00:00.000Z',
    ...overrides,
  };
}

function hookValue(overrides: Partial<CartContextValue> = {}): CartContextValue {
  return {
    cart: makeCart(),
    loading: false,
    error: null,
    itemCount: 2,
    sessionReady: true,
    demoUserName: 'Maya Chen',
    fetchCart: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
    discountError: null,
    discountPending: false,
    applyDiscount: vi.fn(),
    removeDiscount: vi.fn(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <BrowserRouter>
      <CartPage />
    </BrowserRouter>,
  );
}

describe('CartPage', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders server subtotal, discount row and total', () => {
    mockedUseCart.mockReturnValue(hookValue());
    renderPage();
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$110.99');
    expect(screen.getByTestId('cart-discount')).toHaveTextContent('Discount (WELCOME10)');
    expect(screen.getByTestId('cart-discount')).toHaveTextContent('−$11.09');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('$99.90');
  });

  it('uses the server total, not a client-side sum', () => {
    // A deliberately different server subtotal proves no local recomputation.
    mockedUseCart.mockReturnValue(hookValue({ cart: makeCart({ subtotal: 5000, discount: null, total: 5000 }) }));
    renderPage();
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$50.00');
    expect(screen.queryByTestId('cart-discount')).toBeNull();
  });

  it('wires the form to applyDiscount', () => {
    const applyDiscount = vi.fn();
    mockedUseCart.mockReturnValue(hookValue({ applyDiscount }));
    renderPage();
    fireEvent.change(screen.getByLabelText('Discount code'), { target: { value: 'BREW15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(applyDiscount).toHaveBeenCalledWith('BREW15');
  });

  it('empty cart with discount shows code and Remove', () => {
    const removeDiscount = vi.fn();
    mockedUseCart.mockReturnValue(
      hookValue({
        cart: makeCart({ items: [], subtotal: 0, total: 0, discount: { code: 'WELCOME10', percentOff: 10, amount: 0 } }),
        itemCount: 0,
        removeDiscount,
      }),
    );
    renderPage();
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent === 'WELCOME10 will apply to your next items'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove discount code WELCOME10' }));
    expect(removeDiscount).toHaveBeenCalled();
    expect(screen.queryByLabelText('Discount code')).toBeNull();
  });

  it('removing an item keeps the summary rendered and shows the server total', () => {
    mockedUseCart.mockReturnValue(hookValue());
    const { rerender } = renderPage();
    const input = screen.getByLabelText('Discount code');
    mockedUseCart.mockReturnValue(
      hookValue({
        cart: makeCart({ items: [items[1]], subtotal: 9200, discount: { code: 'WELCOME10', percentOff: 10, amount: 920 }, total: 8280 }),
        itemCount: 1,
      }),
    );
    rerender(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>,
    );
    expect(screen.getByLabelText('Discount code')).toBe(input);
    expect(screen.getByTestId('cart-total')).toHaveTextContent('$82.80');
  });
});
