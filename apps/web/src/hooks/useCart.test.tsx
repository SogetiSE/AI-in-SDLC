import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cart } from '@zava/shared';
import { ApiError, api } from '../services/apiClient';
import { CartProvider, useCart } from './useCart';

// Partial mock: keep the real ApiError (a bare automock strips its constructor,
// leaving message "" and statusCode undefined).
vi.mock('../services/apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/apiClient')>();
  return {
    ...actual,
    api: {
      getProducts: vi.fn(),
      getProduct: vi.fn(),
      getCategories: vi.fn(),
      getCart: vi.fn(),
      addToCart: vi.fn(),
      removeFromCart: vi.fn(),
      applyDiscount: vi.fn(),
      removeDiscount: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
    },
  };
});

const mockedApi = vi.mocked(api);

function makeCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      { id: 'item-1', productId: 'p1', quantity: 2, product: { id: 'p1', name: 'Atlas', price: 1899, imageUrl: '/a.svg' } },
      { id: 'item-2', productId: 'p2', quantity: 1, product: { id: 'p2', name: 'Kettle', price: 9200, imageUrl: '/k.svg' } },
    ],
    subtotal: 12998,
    discount: null,
    total: 12998,
    createdAt: '2026-11-11T00:00:00.000Z',
    updatedAt: '2026-11-11T00:00:00.000Z',
    ...overrides,
  };
}

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;

async function renderReadyCart(initial: Cart = makeCart()) {
  mockedApi.getCart.mockResolvedValueOnce(initial);
  const hook = renderHook(() => useCart(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  expect(hook.result.current.cart).toEqual(initial);
  return hook;
}

describe('useCart', () => {
  beforeEach(() => {
    localStorage.setItem('zava_token', 'test-token');
    localStorage.setItem('zava_user', JSON.stringify({ name: 'Maya Chen' }));
  });

  afterEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('removeItem refreshes from server and never sets loading true', async () => {
    const { result } = await renderReadyCart();
    const afterRemove = makeCart({
      items: [makeCart().items[1]],
      subtotal: 9200,
      discount: { code: 'WELCOME10', percentOff: 10, amount: 920 },
      total: 8280,
    });
    mockedApi.removeFromCart.mockResolvedValueOnce(undefined);
    mockedApi.getCart.mockResolvedValueOnce(afterRemove);

    const loadingStates: boolean[] = [];
    await act(async () => {
      const pending = result.current.removeItem('item-1');
      loadingStates.push(result.current.loading);
      await pending;
    });
    loadingStates.push(result.current.loading);

    expect(loadingStates).not.toContain(true);
    expect(mockedApi.getCart).toHaveBeenCalledTimes(2);
    expect(result.current.cart).toEqual(afterRemove);
  });

  it('itemCount updates after removeItem', async () => {
    const { result } = await renderReadyCart();
    expect(result.current.itemCount).toBe(3);
    mockedApi.removeFromCart.mockResolvedValueOnce(undefined);
    mockedApi.getCart.mockResolvedValueOnce(makeCart({ items: [makeCart().items[1]], subtotal: 9200, total: 9200 }));
    await act(() => result.current.removeItem('item-1'));
    expect(result.current.itemCount).toBe(1);
  });

  it('applyDiscount sets cart from response', async () => {
    const { result } = await renderReadyCart();
    const discounted = makeCart({ discount: { code: 'WELCOME10', percentOff: 10, amount: 1299 }, total: 11699 });
    mockedApi.applyDiscount.mockResolvedValueOnce(discounted);
    await act(() => result.current.applyDiscount('welcome10'));
    expect(mockedApi.applyDiscount).toHaveBeenCalledWith('welcome10');
    expect(result.current.cart).toEqual(discounted);
    expect(result.current.discountError).toBeNull();
    expect(result.current.discountPending).toBe(false);
  });

  it('applyDiscount 409 sets discountError to the server message and keeps cart', async () => {
    const initial = makeCart({ discount: { code: 'WELCOME10', percentOff: 10, amount: 1299 }, total: 11699 });
    const { result } = await renderReadyCart(initial);
    const message = 'Only one discount code can be used per order. Remove WELCOME10 to use a different code.';
    mockedApi.applyDiscount.mockRejectedValueOnce(new ApiError(message, 409));
    await act(() => result.current.applyDiscount('BREW15'));
    expect(result.current.discountError).toBe(message);
    expect(result.current.cart).toEqual(initial);
    expect(localStorage.getItem('zava_token')).toBe('test-token');
  });

  it('applyDiscount 401 clears zava_token', async () => {
    const { result } = await renderReadyCart();
    mockedApi.applyDiscount.mockRejectedValueOnce(new ApiError('Invalid or expired token', 401));
    mockedApi.login.mockReturnValue(new Promise(() => {}));
    await act(() => result.current.applyDiscount('WELCOME10'));
    expect(localStorage.getItem('zava_token')).toBeNull();
  });

  it('successful apply / remove clears discountError', async () => {
    const { result } = await renderReadyCart();
    mockedApi.applyDiscount.mockRejectedValueOnce(new ApiError('This discount code is not valid.', 404));
    await act(() => result.current.applyDiscount('NOPE'));
    expect(result.current.discountError).toBe('This discount code is not valid.');

    mockedApi.applyDiscount.mockResolvedValueOnce(makeCart({ discount: { code: 'WELCOME10', percentOff: 10, amount: 1299 }, total: 11699 }));
    await act(() => result.current.applyDiscount('WELCOME10'));
    expect(result.current.discountError).toBeNull();

    mockedApi.applyDiscount.mockRejectedValueOnce(new ApiError('This discount code is not valid.', 404));
    await act(() => result.current.applyDiscount('NOPE'));
    mockedApi.removeDiscount.mockResolvedValueOnce(makeCart());
    await act(() => result.current.removeDiscount());
    expect(result.current.discountError).toBeNull();
    expect(result.current.cart?.discount).toBeNull();
  });
});
