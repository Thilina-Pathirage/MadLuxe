"use client";

import { useEffect, useMemo, useState } from "react";

export const PUBLIC_CART_KEY = "madlaxue_public_cart";
const PUBLIC_CART_EVENT = "madlaxue_public_cart_updated";

export type PublicCartItem = {
  lineId: string;
  variantId: string;
  batchId: string;
  batchLabel: string;
  sku: string;
  productName: string;
  categoryName?: string;
  colorName?: string;
  size?: string;
  unitWeightGrams?: number;
  unitPrice: number;
  imageUrl: string | null;
  maxQtyAtSelection: number;
  qty: number;
};

export const makePublicCartLineId = (variantId: string, batchId: string) => `${variantId}:${batchId}`;

export const normalizePublicCartItems = (items: unknown): PublicCartItem[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const entry = raw as Partial<PublicCartItem> & { maxQty?: number };
      if (!entry.variantId) return null;

      if (entry.lineId && entry.batchId) {
        return {
          lineId: entry.lineId,
          variantId: entry.variantId,
          batchId: entry.batchId,
          batchLabel: entry.batchLabel ?? `Legacy stock · #${entry.batchId.slice(-6).toUpperCase()}`,
          sku: entry.sku ?? "",
          productName: entry.productName ?? "Product",
          categoryName: entry.categoryName,
          colorName: entry.colorName,
          size: entry.size,
          unitWeightGrams: Number(entry.unitWeightGrams ?? 1000),
          unitPrice: Number(entry.unitPrice ?? 0),
          imageUrl: entry.imageUrl ?? null,
          maxQtyAtSelection: Math.max(Number(entry.maxQtyAtSelection ?? entry.maxQty ?? 1), 1),
          qty: Math.max(Number(entry.qty ?? 1), 1),
        } as PublicCartItem;
      }

      const fallbackBatchId = `legacy-${entry.variantId}`;
      return {
        lineId: makePublicCartLineId(entry.variantId, fallbackBatchId),
        variantId: entry.variantId,
        batchId: fallbackBatchId,
        batchLabel: "Legacy stock",
        sku: entry.sku ?? "",
        productName: entry.productName ?? "Product",
        categoryName: entry.categoryName,
        colorName: entry.colorName,
        size: entry.size,
        unitWeightGrams: Number(entry.unitWeightGrams ?? 1000),
        unitPrice: Number(entry.unitPrice ?? 0),
        imageUrl: entry.imageUrl ?? null,
        maxQtyAtSelection: Number.MAX_SAFE_INTEGER,
        qty: Math.max(Number(entry.qty ?? 1), 1),
      } as PublicCartItem;
    })
    .filter((item): item is PublicCartItem => Boolean(item));
};

const emitPublicCartUpdate = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PUBLIC_CART_EVENT));
};

export const readPublicCart = (): PublicCartItem[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PUBLIC_CART_KEY);
  if (!raw) return [];

  try {
    return normalizePublicCartItems(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const writePublicCart = (items: PublicCartItem[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PUBLIC_CART_KEY, JSON.stringify(items));
  emitPublicCartUpdate();
};

export const subscribePublicCart = (onChange: () => void) => {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== PUBLIC_CART_KEY) return;
    onChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(PUBLIC_CART_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PUBLIC_CART_EVENT, onChange);
  };
};

export const upsertPublicCartItem = (nextItem: PublicCartItem, qtyToAdd = 1) => {
  const existing = readPublicCart();
  const foundIndex = existing.findIndex((item) => item.lineId === nextItem.lineId);
  const safeQtyToAdd = Math.max(Math.floor(qtyToAdd), 1);

  if (foundIndex >= 0) {
    const found = existing[foundIndex];
    const maxQtyAtSelection = Math.max(found.maxQtyAtSelection, nextItem.maxQtyAtSelection, 1);
    const nextQty = Math.min(found.qty + safeQtyToAdd, maxQtyAtSelection);

    existing[foundIndex] = {
      ...found,
      ...nextItem,
      maxQtyAtSelection,
      qty: nextQty,
    };
  } else {
    existing.push({
      ...nextItem,
      qty: Math.min(Math.max(nextItem.qty || safeQtyToAdd, 1), Math.max(nextItem.maxQtyAtSelection, 1)),
    });
  }

  writePublicCart(existing);
  return existing;
};

export const setPublicCartItemQty = (lineId: string, qty: number) => {
  const existing = readPublicCart();
  const next = existing.map((item) => {
    if (item.lineId !== lineId) return item;
    const capped = Math.min(Math.max(Math.floor(qty), 1), Math.max(item.maxQtyAtSelection, 1));
    return { ...item, qty: capped };
  });

  writePublicCart(next);
  return next;
};

export const removePublicCartItem = (lineId: string) => {
  const next = readPublicCart().filter((item) => item.lineId !== lineId);
  writePublicCart(next);
  return next;
};

export const clearPublicCart = () => {
  writePublicCart([]);
};

export const getPublicCartCount = (items: PublicCartItem[]) =>
  items.reduce((sum, item) => sum + item.qty, 0);

export const getPublicCartSubtotal = (items: PublicCartItem[]) =>
  items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

export const usePublicCartItems = () => {
  const [items, setItems] = useState<PublicCartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readPublicCart());
    sync();
    return subscribePublicCart(sync);
  }, []);

  return items;
};

export const usePublicCartCount = () => {
  const items = usePublicCartItems();
  return useMemo(() => getPublicCartCount(items), [items]);
};
