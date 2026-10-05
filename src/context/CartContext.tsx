// src/context/CartContext.tsx
'use client';

import { createContext, useContext, useMemo, useState, useCallback } from 'react';

export type CartItem = {
  id: string;
  name: string;
  price: number; // cents
  currency?: string;
  imageUrl?: string;
  options?: Record<string, string>;
  quantity: number;
  taxable?: boolean;
  // Class bookings only — carried through to the order + confirmation email.
  classItemId?: string;
  classTimeId?: string;
  classTimeLabel?: string; // pre-formatted, e.g. "Wed, Mar 4 · 6:00 PM"
  classLocation?: string;
};

type CartCtx = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  totalCents: number;
  currency: string;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
};

const CartContext = createContext<CartCtx>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clear: () => {},
  totalCents: 0,
  currency: 'USD',
  isCartOpen: false,
  openCart: () => {},
  closeCart: () => {},
  isCheckoutOpen: false,
  openCheckout: () => {},
  closeCheckout: () => {},
});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const current = prev[idx];
      if (current.quantity > 1) {
        const next = [...prev];
        next[idx] = { ...current, quantity: current.quantity - 1 };
        return next;
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const currency = items[0]?.currency ?? 'USD';

  const value = useMemo<CartCtx>(
    () => ({
      items,
      addItem,
      removeItem,
      clear,
      totalCents,
      currency,
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      isCheckoutOpen,
      openCheckout: () => setIsCheckoutOpen(true),
      closeCheckout: () => setIsCheckoutOpen(false),
    }),
    [items, addItem, removeItem, clear, totalCents, currency, isCartOpen, isCheckoutOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
