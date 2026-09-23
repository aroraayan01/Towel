"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { lineKey, MAX_QTY, type CartLine } from "@/lib/pricing";

type CartContext = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (line: CartLine) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  wishlist: string[];
  toggleWish: (slug: string) => void;
};

const Ctx = createContext<CartContext | null>(null);

const CART_KEY = "sb.cart.v1";
const WISH_KEY = "sb.wishlist.v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or storage full — the cart still works for this visit
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Hydrate from storage after mount so server and client HTML match
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(read<CartLine[]>(CART_KEY, []));
    setWishlist(read<string[]>(WISH_KEY, []));
    setReady(true);

    // Keep several open tabs in sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setLines(read<CartLine[]>(CART_KEY, []));
      if (e.key === WISH_KEY) setWishlist(read<string[]>(WISH_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (ready) write(CART_KEY, lines);
  }, [lines, ready]);

  useEffect(() => {
    if (ready) write(WISH_KEY, wishlist);
  }, [wishlist, ready]);

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const key = lineKey(line);
      const existing = prev.find((l) => lineKey(l) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l) === key ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + line.quantity) } : l
        );
      }
      return [...prev, line];
    });
    setOpen(true);
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => lineKey(l) !== key)
        : prev.map((l) => (lineKey(l) === key ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l))
    );
  }, []);

  const remove = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const toggleWish = useCallback((slug: string) => {
    setWishlist((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }, []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      ready,
      open,
      setOpen,
      add,
      setQuantity,
      remove,
      clear,
      wishlist,
      toggleWish,
    }),
    [lines, ready, open, add, setQuantity, remove, clear, wishlist, toggleWish]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
