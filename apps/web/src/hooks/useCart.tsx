import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Cart } from '@zava/shared';
import { ApiError, api } from '../services/apiClient';

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  itemCount: number;
  sessionReady: boolean;
  demoUserName: string | null;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  /** Server message from the last failed apply/remove, cleared on success. */
  discountError: string | null;
  discountPending: boolean;
  applyDiscount: (code: string) => Promise<void>;
  removeDiscount: () => Promise<void>;
}

interface StoredUser {
  name: string;
}

const DEMO_CUSTOMER = {
  email: 'customer@example.com',
  password: 'Customer123!',
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem('zava_user');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function clearStoredSession(): void {
  localStorage.removeItem('zava_token');
  localStorage.removeItem('zava_user');
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 401;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountPending, setDiscountPending] = useState(false);
  const [demoUserName, setDemoUserName] = useState<string | null>(() => getStoredUser()?.name ?? null);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCart();
      setCart(data);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearStoredSession();
        setDemoUserName(null);
      }
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  const loginDemoCustomer = useCallback(async () => {
    const auth = await api.login(DEMO_CUSTOMER.email, DEMO_CUSTOMER.password);
    localStorage.setItem('zava_token', auth.token);
    localStorage.setItem('zava_user', JSON.stringify(auth.user));
    setDemoUserName(auth.user.name);
    return auth;
  }, []);

  const ensureDemoSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const existingToken = localStorage.getItem('zava_token');

      if (!existingToken) {
        await loginDemoCustomer();
      } else if (!demoUserName) {
        setDemoUserName(getStoredUser()?.name ?? null);
      }

      try {
        const data = await api.getCart();
        setCart(data);
      } catch (err) {
        if (!isUnauthorizedError(err)) {
          throw err;
        }

        clearStoredSession();
        const auth = await loginDemoCustomer();
        const data = await api.getCart();
        setDemoUserName(auth.user.name);
        setCart(data);
      }
    } catch (err) {
      clearStoredSession();
      setDemoUserName(null);
      setError(err instanceof Error ? err.message : 'Failed to establish session');
    } finally {
      setLoading(false);
    }
  }, [demoUserName, loginDemoCustomer]);

  useEffect(() => {
    void ensureDemoSession();
  }, [ensureDemoSession]);

  const addItem = useCallback(async (productId: string, quantity: number) => {
    setError(null);
    try {
      const data = await api.addToCart(productId, quantity);
      setCart(data);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearStoredSession();
        setDemoUserName(null);
      }
      setError(err instanceof Error ? err.message : 'Failed to add item');
    }
  }, []);

  const handleMutationError = useCallback((err: unknown) => {
    if (isUnauthorizedError(err)) {
      clearStoredSession();
      setDemoUserName(null);
    }
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    setError(null);
    try {
      await api.removeFromCart(itemId);
      // Refresh silently (no loading flag) so the page does not flash; the server
      // recalculates subtotal, discount and total.
      setCart(await api.getCart());
    } catch (err) {
      handleMutationError(err);
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    }
  }, [handleMutationError]);

  const applyDiscount = useCallback(async (code: string) => {
    setDiscountPending(true);
    try {
      setCart(await api.applyDiscount(code));
      setDiscountError(null);
    } catch (err) {
      handleMutationError(err);
      setDiscountError(err instanceof Error ? err.message : 'Failed to apply discount code');
    } finally {
      setDiscountPending(false);
    }
  }, [handleMutationError]);

  const removeDiscount = useCallback(async () => {
    setDiscountPending(true);
    try {
      setCart(await api.removeDiscount());
      setDiscountError(null);
    } catch (err) {
      handleMutationError(err);
      setDiscountError(err instanceof Error ? err.message : 'Failed to remove discount code');
    } finally {
      setDiscountPending(false);
    }
  }, [handleMutationError]);

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      error,
      itemCount,
      sessionReady: !loading,
      demoUserName,
      fetchCart,
      addItem,
      removeItem,
      discountError,
      discountPending,
      applyDiscount,
      removeDiscount,
    }),
    [
      addItem,
      applyDiscount,
      cart,
      demoUserName,
      discountError,
      discountPending,
      error,
      fetchCart,
      itemCount,
      loading,
      removeDiscount,
      removeItem,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
}