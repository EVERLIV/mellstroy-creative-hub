import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type Quantities = Record<string, number>;

interface CartQuantitiesContextValue {
  quantities: Quantities;
  getQuantity: (id: string) => number;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

const CartQuantitiesContext = createContext<CartQuantitiesContextValue | null>(null);

export function CartQuantitiesProvider({ children }: { children: React.ReactNode }) {
  const [quantities, setQuantities] = useState<Quantities>({});

  const getQuantity = useCallback((id: string) => quantities[id] ?? 0, [quantities]);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setQuantities((prev) => {
      if (quantity <= 0) {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }
      if (prev[id] === quantity) return prev;
      return { ...prev, [id]: quantity };
    });
  }, []);

  const clear = useCallback(() => setQuantities({}), []);

  const value = useMemo(
    () => ({ quantities, getQuantity, setQuantity, clear }),
    [quantities, getQuantity, setQuantity, clear]
  );

  return <CartQuantitiesContext.Provider value={value}>{children}</CartQuantitiesContext.Provider>;
}

export function useCartQuantities() {
  const ctx = useContext(CartQuantitiesContext);
  if (!ctx) {
    throw new Error('useCartQuantities must be used within CartQuantitiesProvider');
  }
  return ctx;
}

/** Safe local fallback when a tree has no provider (e.g. isolated story). */
export function useOptionalCartQuantities() {
  return useContext(CartQuantitiesContext);
}
