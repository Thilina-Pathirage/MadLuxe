/*
  MADLAXUE DUMMY DATA
  ===================
  This file provides static data for frontend-only development.

  When connecting to the live backend API, replace data imports with calls to:
    import { api } from '@/lib/api'
    Base URL: http://localhost:5000/api  (set via NEXT_PUBLIC_API_URL in .env.local)

  Example replacement:
    BEFORE: import { VARIANTS } from '@/data/dummy'
    AFTER:  const { data } = await api.getVariants()
*/

// MADLAXUE — Single source of dummy data for the entire app

import dayjs from "dayjs";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

export const COLORS = [
  "Pink", "Blue", "White", "Grey", "Navy", "Green", "Cream", "Gold",
  "Red", "Charcoal", "Beige", "Teal", "Burgundy", "Mustard", "Black",
];

export const COLOR_HEX: Record<string, string> = {
  Pink: "#f48fb1",
  Blue: "#1976d2",
  White: "#f5f5f5",
  Grey: "#9e9e9e",
  Navy: "#1a237e",
  Green: "#388e3c",
  Cream: "#f5f0e8",
  Gold: "#f9a825",
  Red: "#c62828",
  Charcoal: "#37474f",
  Beige: "#d7ccc8",
  Teal: "#00695c",
  Burgundy: "#880e4f",
  Mustard: "#f57f17",
  Black: "#212121",
};

export const CATEGORIES = [
  { id: 1, name: "Bedsheets",        types: 2, variants: 13 },
  { id: 2, name: "Blankets",         types: 8, variants: 24 },
  { id: 3, name: "Sofa Pillow Covers", types: 1, variants: 6 },
  { id: 4, name: "Table Runners",    types: 1, variants: 5 },
  { id: 5, name: "Table Cloths",     types: 1, variants: 5 },
];

export const PRODUCT_TYPES: Record<string, string[]> = {
  Bedsheets:           ["Stripe", "Egyptian Cotton"],
  Blankets:            ["Printed Checks", "Waffle", "Ribbed", "Pineapple Grid", "Ribbed Design", "Royal Type 1", "Royal Type 2", "Popcorn"],
  "Sofa Pillow Covers": ["Standard"],
  "Table Runners":     ["Inside Colour Type"],
  "Table Cloths":      ["Inside Colour Type"],
};

export const SIZES: Record<string, string[]> = {
  Stripe:              ["Single", "King", "Superking"],
  "Egyptian Cotton":   ["Single", "King"],
  default:             ["N/A"],
};

// ─────────────────────────────────────────────
// VARIANTS
// ─────────────────────────────────────────────

export interface Variant {
  id: number;
  sku: string;
  category: string;
  type: string;
  size: string;
  color: string;
  costPrice: number;
  sellPrice: number;
  stockQty: number;
  lowStockThreshold: number;
  isActive: boolean;
  imageUrl: string;
}

function sku(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

export const VARIANTS: Variant[] = [
  // Bedsheets – Stripe
  { id: 1,  sku: sku("BS-STR", 1),  category: "Bedsheets", type: "Stripe",          size: "Single",     color: "White",    costPrice: 8.50,  sellPrice: 16.99, stockQty: 22, lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 2,  sku: sku("BS-STR", 2),  category: "Bedsheets", type: "Stripe",          size: "Single",     color: "Blue",     costPrice: 8.50,  sellPrice: 16.99, stockQty: 3,  lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 3,  sku: sku("BS-STR", 3),  category: "Bedsheets", type: "Stripe",          size: "King",       color: "White",    costPrice: 11.00, sellPrice: 22.99, stockQty: 14, lowStockThreshold: 4, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 4,  sku: sku("BS-STR", 4),  category: "Bedsheets", type: "Stripe",          size: "King",       color: "Grey",     costPrice: 11.00, sellPrice: 22.99, stockQty: 8,  lowStockThreshold: 4, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 5,  sku: sku("BS-STR", 5),  category: "Bedsheets", type: "Stripe",          size: "Superking",  color: "Navy",     costPrice: 14.00, sellPrice: 27.99, stockQty: 0,  lowStockThreshold: 3, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 6,  sku: sku("BS-STR", 6),  category: "Bedsheets", type: "Stripe",          size: "Superking",  color: "Charcoal", costPrice: 14.00, sellPrice: 27.99, stockQty: 2,  lowStockThreshold: 3, isActive: true,  imageUrl: "/images/placeholder-product.png" },

  // Bedsheets – Egyptian Cotton
  { id: 7,  sku: sku("BS-EGY", 1),  category: "Bedsheets", type: "Egyptian Cotton", size: "Single",     color: "Cream",    costPrice: 14.00, sellPrice: 29.99, stockQty: 9,  lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 8,  sku: sku("BS-EGY", 2),  category: "Bedsheets", type: "Egyptian Cotton", size: "Single",     color: "White",    costPrice: 14.00, sellPrice: 29.99, stockQty: 12, lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 9,  sku: sku("BS-EGY", 3),  category: "Bedsheets", type: "Egyptian Cotton", size: "King",       color: "Cream",    costPrice: 18.00, sellPrice: 37.99, stockQty: 4,  lowStockThreshold: 3, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 10, sku: sku("BS-EGY", 4),  category: "Bedsheets", type: "Egyptian Cotton", size: "King",       color: "Gold",     costPrice: 18.00, sellPrice: 37.99, stockQty: 0,  lowStockThreshold: 3, isActive: true,  imageUrl: "/images/placeholder-product.png" },

  // Blankets – Printed Checks
  { id: 11, sku: sku("BL-CHK", 1),  category: "Blankets",  type: "Printed Checks",  size: "N/A",        color: "Red",      costPrice: 12.00, sellPrice: 24.99, stockQty: 17, lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 12, sku: sku("BL-CHK", 2),  category: "Blankets",  type: "Printed Checks",  size: "N/A",        color: "Navy",     costPrice: 12.00, sellPrice: 24.99, stockQty: 5,  lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 13, sku: sku("BL-CHK", 3),  category: "Blankets",  type: "Printed Checks",  size: "N/A",        color: "Grey",     costPrice: 12.00, sellPrice: 24.99, stockQty: 8,  lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },

  // Blankets – Waffle
  { id: 14, sku: sku("BL-WFL", 1),  category: "Blankets",  type: "Waffle",          size: "N/A",        color: "White",    costPrice: 10.00, sellPrice: 21.99, stockQty: 20, lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 15, sku: sku("BL-WFL", 2),  category: "Blankets",  type: "Waffle",          size: "N/A",        color: "Beige",    costPrice: 10.00, sellPrice: 21.99, stockQty: 11, lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 16, sku: sku("BL-WFL", 3),  category: "Blankets",  type: "Waffle",          size: "N/A",        color: "Grey",     costPrice: 10.00, sellPrice: 21.99, stockQty: 2,  lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },

  // Blankets – Ribbed
  { id: 17, sku: sku("BL-RBD", 1),  category: "Blankets",  type: "Ribbed",          size: "N/A",        color: "Cream",    costPrice: 11.00, sellPrice: 23.99, stockQty: 15, lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 18, sku: sku("BL-RBD", 2),  category: "Blankets",  type: "Ribbed",          size: "N/A",        color: "Teal",     costPrice: 11.00, sellPrice: 23.99, stockQty: 6,  lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 19, sku: sku("BL-RBD", 3),  category: "Blankets",  type: "Ribbed",          size: "N/A",        color: "Mustard",  costPrice: 11.00, sellPrice: 23.99, stockQty: 0,  lowStockThreshold: 3, isActive: true,  imageUrl: "/images/placeholder-product.png" },

  // Blankets – Pineapple Grid
  { id: 20, sku: sku("BL-PNG", 1),  category: "Blankets",  type: "Pineapple Grid",  size: "N/A",        color: "White",    costPrice: 13.00, sellPrice: 26.99, stockQty: 9,  lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 21, sku: sku("BL-PNG", 2),  category: "Blankets",  type: "Pineapple Grid",  size: "N/A",        color: "Pink",     costPrice: 13.00, sellPrice: 26.99, stockQty: 3,  lowStockThreshold: 4, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 22, sku: sku("BL-PNG", 3),  category: "Blankets",  type: "Pineapple Grid",  size: "N/A",        color: "Gold",     costPrice: 13.00, sellPrice: 26.99, stockQty: 7,  lowStockThreshold: 4, isActive: true,  imageUrl: "/images/placeholder-product.png" },

  // Blankets – Ribbed Design
  { id: 23, sku: sku("BL-RDS", 1),  category: "Blankets",  type: "Ribbed Design",   size: "N/A",        color: "Navy",     costPrice: 12.50, sellPrice: 25.99, stockQty: 10, lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 24, sku: sku("BL-RDS", 2),  category: "Blankets",  type: "Ribbed Design",   size: "N/A",        color: "Charcoal", costPrice: 12.50, sellPrice: 25.99, stockQty: 4,  lowStockThreshold: 4, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 25, sku: sku("BL-RDS", 3),  category: "Blankets",  type: "Ribbed Design",   size: "N/A",        color: "Burgundy", costPrice: 12.50, sellPrice: 25.99, stockQty: 8,  lowStockThreshold: 4, isActive: true,  imageUrl: "/images/placeholder-product.png" },

  // Blankets – Royal Type 1
  { id: 26, sku: sku("BL-RY1", 1),  category: "Blankets",  type: "Royal Type 1",    size: "N/A",        color: "Gold",     costPrice: 18.00, sellPrice: 36.99, stockQty: 6,  lowStockThreshold: 3, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 27, sku: sku("BL-RY1", 2),  category: "Blankets",  type: "Royal Type 1",    size: "N/A",        color: "Cream",    costPrice: 18.00, sellPrice: 36.99, stockQty: 2,  lowStockThreshold: 3, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 28, sku: sku("BL-RY1", 3),  category: "Blankets",  type: "Royal Type 1",    size: "N/A",        color: "Burgundy", costPrice: 18.00, sellPrice: 36.99, stockQty: 4,  lowStockThreshold: 3, isActive: true,  imageUrl: "/images/placeholder-product.png" },

  // Blankets – Royal Type 2
  { id: 29, sku: sku("BL-RY2", 1),  category: "Blankets",  type: "Royal Type 2",    size: "N/A",        color: "Blue",     costPrice: 19.00, sellPrice: 38.99, stockQty: 5,  lowStockThreshold: 3, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 30, sku: sku("BL-RY2", 2),  category: "Blankets",  type: "Royal Type 2",    size: "N/A",        color: "Gold",     costPrice: 19.00, sellPrice: 38.99, stockQty: 1,  lowStockThreshold: 3, isActive: true,  imageUrl: "/images/placeholder-product.png" },

  // Blankets – Popcorn
  { id: 31, sku: sku("BL-POP", 1),  category: "Blankets",  type: "Popcorn",         size: "N/A",        color: "White",    costPrice: 9.00,  sellPrice: 19.99, stockQty: 25, lowStockThreshold: 6, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 32, sku: sku("BL-POP", 2),  category: "Blankets",  type: "Popcorn",         size: "N/A",        color: "Pink",     costPrice: 9.00,  sellPrice: 19.99, stockQty: 13, lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 33, sku: sku("BL-POP", 3),  category: "Blankets",  type: "Popcorn",         size: "N/A",        color: "Grey",     costPrice: 9.00,  sellPrice: 19.99, stockQty: 7,  lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },

  // Sofa Pillow Covers
  { id: 34, sku: sku("SPC-STD", 1), category: "Sofa Pillow Covers", type: "Standard", size: "N/A",      color: "Navy",     costPrice: 4.00,  sellPrice: 8.99,  stockQty: 18, lowStockThreshold: 8, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 35, sku: sku("SPC-STD", 2), category: "Sofa Pillow Covers", type: "Standard", size: "N/A",      color: "Grey",     costPrice: 4.00,  sellPrice: 8.99,  stockQty: 10, lowStockThreshold: 8, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 36, sku: sku("SPC-STD", 3), category: "Sofa Pillow Covers", type: "Standard", size: "N/A",      color: "Cream",    costPrice: 4.00,  sellPrice: 8.99,  stockQty: 6,  lowStockThreshold: 8, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 37, sku: sku("SPC-STD", 4), category: "Sofa Pillow Covers", type: "Standard", size: "N/A",      color: "Teal",     costPrice: 4.00,  sellPrice: 8.99,  stockQty: 3,  lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 38, sku: sku("SPC-STD", 5), category: "Sofa Pillow Covers", type: "Standard", size: "N/A",      color: "Mustard",  costPrice: 4.00,  sellPrice: 8.99,  stockQty: 0,  lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 39, sku: sku("SPC-STD", 6), category: "Sofa Pillow Covers", type: "Standard", size: "N/A",      color: "Burgundy", costPrice: 4.00,  sellPrice: 8.99,  stockQty: 14, lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },

  // Table Runners
  { id: 40, sku: sku("TR-ICT", 1),  category: "Table Runners",   type: "Inside Colour Type", size: "N/A", color: "Gold",    costPrice: 5.50,  sellPrice: 11.99, stockQty: 20, lowStockThreshold: 6, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 41, sku: sku("TR-ICT", 2),  category: "Table Runners",   type: "Inside Colour Type", size: "N/A", color: "Red",     costPrice: 5.50,  sellPrice: 11.99, stockQty: 12, lowStockThreshold: 6, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 42, sku: sku("TR-ICT", 3),  category: "Table Runners",   type: "Inside Colour Type", size: "N/A", color: "Green",   costPrice: 5.50,  sellPrice: 11.99, stockQty: 4,  lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 43, sku: sku("TR-ICT", 4),  category: "Table Runners",   type: "Inside Colour Type", size: "N/A", color: "Navy",    costPrice: 5.50,  sellPrice: 11.99, stockQty: 8,  lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 44, sku: sku("TR-ICT", 5),  category: "Table Runners",   type: "Inside Colour Type", size: "N/A", color: "White",   costPrice: 5.50,  sellPrice: 11.99, stockQty: 16, lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },

  // Table Cloths
  { id: 45, sku: sku("TC-ICT", 1),  category: "Table Cloths",    type: "Inside Colour Type", size: "N/A", color: "White",   costPrice: 7.00,  sellPrice: 14.99, stockQty: 15, lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 46, sku: sku("TC-ICT", 2),  category: "Table Cloths",    type: "Inside Colour Type", size: "N/A", color: "Cream",   costPrice: 7.00,  sellPrice: 14.99, stockQty: 9,  lowStockThreshold: 5, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 47, sku: sku("TC-ICT", 3),  category: "Table Cloths",    type: "Inside Colour Type", size: "N/A", color: "Navy",    costPrice: 7.00,  sellPrice: 14.99, stockQty: 2,  lowStockThreshold: 4, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 48, sku: sku("TC-ICT", 4),  category: "Table Cloths",    type: "Inside Colour Type", size: "N/A", color: "Red",     costPrice: 7.00,  sellPrice: 14.99, stockQty: 0,  lowStockThreshold: 4, isActive: true,  imageUrl: "/images/placeholder-product.png" },
  { id: 49, sku: sku("TC-ICT", 5),  category: "Table Cloths",    type: "Inside Colour Type", size: "N/A", color: "Gold",    costPrice: 7.00,  sellPrice: 14.99, stockQty: 11, lowStockThreshold: 4, isActive: true,  imageUrl: "/images/placeholder-product.png" },
];

// ─────────────────────────────────────────────
// STOCK MOVEMENTS
// ─────────────────────────────────────────────

export type MovementType = "IN" | "OUT" | "ADJUST";

export interface StockMovement {
  id: number;
  variantId: number;
  variantLabel: string;
  type: MovementType;
  qty: number;
  qtyBefore: number;
  qtyAfter: number;
  reason: string;
  orderId?: string;
  costPrice?: number;
  date: string;
}

function variantLabel(v: Variant): string {
  return `${v.category} / ${v.type}${v.size !== "N/A" ? ` / ${v.size}` : ""} / ${v.color}`;
}

export const STOCK_MOVEMENTS: StockMovement[] = [
  { id: 1,  variantId: 1,  variantLabel: variantLabel(VARIANTS[0]),  type: "IN",     qty: 20, qtyBefore: 2,  qtyAfter: 22, reason: "Supplier delivery",  costPrice: 8.50,  date: "2026-03-01" },
  { id: 2,  variantId: 3,  variantLabel: variantLabel(VARIANTS[2]),  type: "IN",     qty: 10, qtyBefore: 4,  qtyAfter: 14, reason: "Supplier delivery",  costPrice: 11.00, date: "2026-03-01" },
  { id: 3,  variantId: 11, variantLabel: variantLabel(VARIANTS[10]), type: "IN",     qty: 15, qtyBefore: 2,  qtyAfter: 17, reason: "Restocked",          costPrice: 12.00, date: "2026-03-02" },
  { id: 4,  variantId: 14, variantLabel: variantLabel(VARIANTS[13]), type: "IN",     qty: 20, qtyBefore: 0,  qtyAfter: 20, reason: "New stock",          costPrice: 10.00, date: "2026-03-02" },
  { id: 5,  variantId: 31, variantLabel: variantLabel(VARIANTS[30]), type: "IN",     qty: 25, qtyBefore: 0,  qtyAfter: 25, reason: "Supplier delivery",  costPrice: 9.00,  date: "2026-03-03" },
  { id: 6,  variantId: 34, variantLabel: variantLabel(VARIANTS[33]), type: "IN",     qty: 20, qtyBefore: 0,  qtyAfter: 20, reason: "New stock",          costPrice: 4.00,  date: "2026-03-03" },
  { id: 7,  variantId: 40, variantLabel: variantLabel(VARIANTS[39]), type: "IN",     qty: 20, qtyBefore: 0,  qtyAfter: 20, reason: "Initial stock",      costPrice: 5.50,  date: "2026-03-04" },
  { id: 8,  variantId: 45, variantLabel: variantLabel(VARIANTS[44]), type: "IN",     qty: 15, qtyBefore: 0,  qtyAfter: 15, reason: "Initial stock",      costPrice: 7.00,  date: "2026-03-04" },
  { id: 9,  variantId: 7,  variantLabel: variantLabel(VARIANTS[6]),  type: "IN",     qty: 10, qtyBefore: 0,  qtyAfter: 10, reason: "Supplier delivery",  costPrice: 14.00, date: "2026-03-05" },
  { id: 10, variantId: 17, variantLabel: variantLabel(VARIANTS[16]), type: "IN",     qty: 15, qtyBefore: 0,  qtyAfter: 15, reason: "Restocked",          costPrice: 11.00, date: "2026-03-05" },

  { id: 11, variantId: 1,  variantLabel: variantLabel(VARIANTS[0]),  type: "OUT",    qty: 2,  qtyBefore: 24, qtyAfter: 22, reason: "Order",  orderId: "ORD-001", date: "2026-03-06" },
  { id: 12, variantId: 3,  variantLabel: variantLabel(VARIANTS[2]),  type: "OUT",    qty: 1,  qtyBefore: 15, qtyAfter: 14, reason: "Order",  orderId: "ORD-001", date: "2026-03-06" },
  { id: 13, variantId: 11, variantLabel: variantLabel(VARIANTS[10]), type: "OUT",    qty: 3,  qtyBefore: 20, qtyAfter: 17, reason: "Order",  orderId: "ORD-002", date: "2026-03-07" },
  { id: 14, variantId: 14, variantLabel: variantLabel(VARIANTS[13]), type: "OUT",    qty: 2,  qtyBefore: 22, qtyAfter: 20, reason: "Order",  orderId: "ORD-002", date: "2026-03-07" },
  { id: 15, variantId: 31, variantLabel: variantLabel(VARIANTS[30]), type: "OUT",    qty: 4,  qtyBefore: 29, qtyAfter: 25, reason: "Order",  orderId: "ORD-003", date: "2026-03-08" },
  { id: 16, variantId: 34, variantLabel: variantLabel(VARIANTS[33]), type: "OUT",    qty: 2,  qtyBefore: 22, qtyAfter: 20, reason: "Order",  orderId: "ORD-003", date: "2026-03-08" },
  { id: 17, variantId: 40, variantLabel: variantLabel(VARIANTS[39]), type: "OUT",    qty: 1,  qtyBefore: 21, qtyAfter: 20, reason: "Order",  orderId: "ORD-004", date: "2026-03-09" },
  { id: 18, variantId: 7,  variantLabel: variantLabel(VARIANTS[6]),  type: "OUT",    qty: 1,  qtyBefore: 10, qtyAfter: 9,  reason: "Order",  orderId: "ORD-004", date: "2026-03-09" },
  { id: 19, variantId: 20, variantLabel: variantLabel(VARIANTS[19]), type: "OUT",    qty: 2,  qtyBefore: 11, qtyAfter: 9,  reason: "Order",  orderId: "ORD-005", date: "2026-03-10" },
  { id: 20, variantId: 45, variantLabel: variantLabel(VARIANTS[44]), type: "OUT",    qty: 3,  qtyBefore: 18, qtyAfter: 15, reason: "Order",  orderId: "ORD-005", date: "2026-03-10" },

  { id: 21, variantId: 16, variantLabel: variantLabel(VARIANTS[15]), type: "ADJUST", qty: -3, qtyBefore: 5,  qtyAfter: 2,  reason: "Damaged",  date: "2026-03-11" },
  { id: 22, variantId: 19, variantLabel: variantLabel(VARIANTS[18]), type: "ADJUST", qty: -2, qtyBefore: 2,  qtyAfter: 0,  reason: "Lost",     date: "2026-03-11" },
  { id: 23, variantId: 5,  variantLabel: variantLabel(VARIANTS[4]),  type: "ADJUST", qty: -2, qtyBefore: 2,  qtyAfter: 0,  reason: "Damaged",  date: "2026-03-12" },
  { id: 24, variantId: 21, variantLabel: variantLabel(VARIANTS[20]), type: "ADJUST", qty: -4, qtyBefore: 7,  qtyAfter: 3,  reason: "Recount",  date: "2026-03-12" },
  { id: 25, variantId: 36, variantLabel: variantLabel(VARIANTS[35]), type: "ADJUST", qty: -2, qtyBefore: 8,  qtyAfter: 6,  reason: "Returned", date: "2026-03-13" },

  { id: 26, variantId: 1,  variantLabel: variantLabel(VARIANTS[0]),  type: "OUT",    qty: 1,  qtyBefore: 23, qtyAfter: 22, reason: "Order",  orderId: "ORD-006", date: "2026-03-14" },
  { id: 27, variantId: 32, variantLabel: variantLabel(VARIANTS[31]), type: "OUT",    qty: 3,  qtyBefore: 16, qtyAfter: 13, reason: "Order",  orderId: "ORD-006", date: "2026-03-14" },
  { id: 28, variantId: 41, variantLabel: variantLabel(VARIANTS[40]), type: "OUT",    qty: 2,  qtyBefore: 14, qtyAfter: 12, reason: "Order",  orderId: "ORD-007", date: "2026-03-15" },
  { id: 29, variantId: 46, variantLabel: variantLabel(VARIANTS[45]), type: "OUT",    qty: 1,  qtyBefore: 10, qtyAfter: 9,  reason: "Order",  orderId: "ORD-007", date: "2026-03-15" },
  { id: 30, variantId: 8,  variantLabel: variantLabel(VARIANTS[7]),  type: "OUT",    qty: 2,  qtyBefore: 14, qtyAfter: 12, reason: "Order",  orderId: "ORD-008", date: "2026-03-16" },

  { id: 31, variantId: 12, variantLabel: variantLabel(VARIANTS[11]), type: "IN",     qty: 10, qtyBefore: 0,  qtyAfter: 10, reason: "Restocked", costPrice: 12.00, date: "2026-03-17" },
  { id: 32, variantId: 2,  variantLabel: variantLabel(VARIANTS[1]),  type: "IN",     qty: 5,  qtyBefore: 0,  qtyAfter: 5,  reason: "Restocked", costPrice: 8.50,  date: "2026-03-17" },
  { id: 33, variantId: 6,  variantLabel: variantLabel(VARIANTS[5]),  type: "IN",     qty: 5,  qtyBefore: 0,  qtyAfter: 5,  reason: "Restocked", costPrice: 14.00, date: "2026-03-18" },

  { id: 34, variantId: 1,  variantLabel: variantLabel(VARIANTS[0]),  type: "OUT",    qty: 2,  qtyBefore: 24, qtyAfter: 22, reason: "Order",  orderId: "ORD-009", date: "2026-03-18" },
  { id: 35, variantId: 15, variantLabel: variantLabel(VARIANTS[14]), type: "OUT",    qty: 1,  qtyBefore: 12, qtyAfter: 11, reason: "Order",  orderId: "ORD-009", date: "2026-03-18" },
  { id: 36, variantId: 23, variantLabel: variantLabel(VARIANTS[22]), type: "OUT",    qty: 2,  qtyBefore: 12, qtyAfter: 10, reason: "Order",  orderId: "ORD-010", date: "2026-03-19" },
  { id: 37, variantId: 33, variantLabel: variantLabel(VARIANTS[32]), type: "OUT",    qty: 3,  qtyBefore: 10, qtyAfter: 7,  reason: "Order",  orderId: "ORD-010", date: "2026-03-19" },
  { id: 38, variantId: 44, variantLabel: variantLabel(VARIANTS[43]), type: "OUT",    qty: 2,  qtyBefore: 10, qtyAfter: 8,  reason: "Order",  orderId: "ORD-011", date: "2026-03-20" },
  { id: 39, variantId: 35, variantLabel: variantLabel(VARIANTS[34]), type: "OUT",    qty: 1,  qtyBefore: 11, qtyAfter: 10, reason: "Order",  orderId: "ORD-011", date: "2026-03-20" },
  { id: 40, variantId: 26, variantLabel: variantLabel(VARIANTS[25]), type: "OUT",    qty: 1,  qtyBefore: 7,  qtyAfter: 6,  reason: "Order",  orderId: "ORD-012", date: "2026-03-21" },
  { id: 41, variantId: 9,  variantLabel: variantLabel(VARIANTS[8]),  type: "OUT",    qty: 1,  qtyBefore: 5,  qtyAfter: 4,  reason: "Order",  orderId: "ORD-012", date: "2026-03-21" },
  { id: 42, variantId: 47, variantLabel: variantLabel(VARIANTS[46]), type: "OUT",    qty: 2,  qtyBefore: 4,  qtyAfter: 2,  reason: "Order",  orderId: "ORD-013", date: "2026-03-22" },
  { id: 43, variantId: 43, variantLabel: variantLabel(VARIANTS[42]), type: "OUT",    qty: 1,  qtyBefore: 9,  qtyAfter: 8,  reason: "Order",  orderId: "ORD-013", date: "2026-03-22" },
  { id: 44, variantId: 29, variantLabel: variantLabel(VARIANTS[28]), type: "OUT",    qty: 1,  qtyBefore: 6,  qtyAfter: 5,  reason: "Order",  orderId: "ORD-014", date: "2026-03-22" },
  { id: 45, variantId: 3,  variantLabel: variantLabel(VARIANTS[2]),  type: "OUT",    qty: 3,  qtyBefore: 17, qtyAfter: 14, reason: "Order",  orderId: "ORD-015", date: "2026-03-23" },
  { id: 46, variantId: 32, variantLabel: variantLabel(VARIANTS[31]), type: "OUT",    qty: 2,  qtyBefore: 15, qtyAfter: 13, reason: "Order",  orderId: "ORD-015", date: "2026-03-23" },

  // Recent adjustments
  { id: 47, variantId: 38, variantLabel: variantLabel(VARIANTS[37]), type: "ADJUST", qty: -3, qtyBefore: 3,  qtyAfter: 0,  reason: "Damaged",  date: "2026-03-23" },
  { id: 48, variantId: 24, variantLabel: variantLabel(VARIANTS[23]), type: "ADJUST", qty: 2,  qtyBefore: 2,  qtyAfter: 4,  reason: "Found",    date: "2026-03-23" },
];

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

export type OrderStatus = "Completed" | "Pending" | "Cancelled";

export interface OrderItem {
  variantId: number;
  variantLabel: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  orderRef: string;
  customerName: string;
  customerPhone: string;
  couponCode: string | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
}

export const ORDERS: Order[] = [
  {
    id: 1, orderRef: "ORD-001", customerName: "Sarah Bennett",  customerPhone: "07700900001",
    couponCode: null, subtotal: 55.97, discountAmount: 0,    total: 55.97, status: "Completed",
    items: [
      { variantId: 1,  variantLabel: variantLabel(VARIANTS[0]),  qty: 2, unitPrice: 16.99, lineTotal: 33.98 },
      { variantId: 3,  variantLabel: variantLabel(VARIANTS[2]),  qty: 1, unitPrice: 22.99, lineTotal: 22.99 },
    ],
    createdAt: "2026-03-06",
  },
  {
    id: 2, orderRef: "ORD-002", customerName: "James O'Brien",  customerPhone: "07700900002",
    couponCode: "SUMMER10", subtotal: 70.97, discountAmount: 7.10, total: 63.87, status: "Completed",
    items: [
      { variantId: 11, variantLabel: variantLabel(VARIANTS[10]), qty: 3, unitPrice: 24.99, lineTotal: 74.97 },
    ],
    createdAt: "2026-03-07",
  },
  {
    id: 3, orderRef: "ORD-003", customerName: "Priya Sharma",   customerPhone: "07700900003",
    couponCode: null, subtotal: 83.96, discountAmount: 0,    total: 83.96, status: "Completed",
    items: [
      { variantId: 31, variantLabel: variantLabel(VARIANTS[30]), qty: 4, unitPrice: 19.99, lineTotal: 79.96 },
      { variantId: 34, variantLabel: variantLabel(VARIANTS[33]), qty: 2, unitPrice: 8.99,  lineTotal: 17.98 },
    ],
    createdAt: "2026-03-08",
  },
  {
    id: 4, orderRef: "ORD-004", customerName: "Ahmed Hassan",   customerPhone: "07700900004",
    couponCode: "FLAT5", subtotal: 40.98, discountAmount: 5.00, total: 35.98, status: "Completed",
    items: [
      { variantId: 40, variantLabel: variantLabel(VARIANTS[39]), qty: 1, unitPrice: 11.99, lineTotal: 11.99 },
      { variantId: 7,  variantLabel: variantLabel(VARIANTS[6]),  qty: 1, unitPrice: 29.99, lineTotal: 29.99 },
    ],
    createdAt: "2026-03-09",
  },
  {
    id: 5, orderRef: "ORD-005", customerName: "Emma Williams",  customerPhone: "07700900005",
    couponCode: null, subtotal: 62.95, discountAmount: 0,    total: 62.95, status: "Completed",
    items: [
      { variantId: 20, variantLabel: variantLabel(VARIANTS[19]), qty: 2, unitPrice: 26.99, lineTotal: 53.98 },
      { variantId: 45, variantLabel: variantLabel(VARIANTS[44]), qty: 3, unitPrice: 14.99, lineTotal: 44.97 },
    ],
    createdAt: "2026-03-10",
  },
  {
    id: 6, orderRef: "ORD-006", customerName: "Tom Fletcher",   customerPhone: "07700900006",
    couponCode: "WELCOME15", subtotal: 52.97, discountAmount: 7.95, total: 45.02, status: "Completed",
    items: [
      { variantId: 1,  variantLabel: variantLabel(VARIANTS[0]),  qty: 1, unitPrice: 16.99, lineTotal: 16.99 },
      { variantId: 32, variantLabel: variantLabel(VARIANTS[31]), qty: 3, unitPrice: 19.99, lineTotal: 59.97 },
    ],
    createdAt: "2026-03-14",
  },
  {
    id: 7, orderRef: "ORD-007", customerName: "Chloe Martin",   customerPhone: "07700900007",
    couponCode: null, subtotal: 38.97, discountAmount: 0,    total: 38.97, status: "Completed",
    items: [
      { variantId: 41, variantLabel: variantLabel(VARIANTS[40]), qty: 2, unitPrice: 11.99, lineTotal: 23.98 },
      { variantId: 46, variantLabel: variantLabel(VARIANTS[45]), qty: 1, unitPrice: 14.99, lineTotal: 14.99 },
    ],
    createdAt: "2026-03-15",
  },
  {
    id: 8, orderRef: "ORD-008", customerName: "Daniel Park",    customerPhone: "07700900008",
    couponCode: null, subtotal: 33.98, discountAmount: 0,    total: 33.98, status: "Completed",
    items: [
      { variantId: 8,  variantLabel: variantLabel(VARIANTS[7]),  qty: 2, unitPrice: 29.99, lineTotal: 59.98 },
    ],
    createdAt: "2026-03-16",
  },
  {
    id: 9, orderRef: "ORD-009", customerName: "Fatima Al-Zahra", customerPhone: "07700900009",
    couponCode: "SUMMER10", subtotal: 38.98, discountAmount: 3.90, total: 35.08, status: "Completed",
    items: [
      { variantId: 1,  variantLabel: variantLabel(VARIANTS[0]),  qty: 2, unitPrice: 16.99, lineTotal: 33.98 },
      { variantId: 15, variantLabel: variantLabel(VARIANTS[14]), qty: 1, unitPrice: 21.99, lineTotal: 21.99 },
    ],
    createdAt: "2026-03-18",
  },
  {
    id: 10, orderRef: "ORD-010", customerName: "George Hughes",  customerPhone: "07700900010",
    couponCode: null, subtotal: 111.95, discountAmount: 0,   total: 111.95, status: "Completed",
    items: [
      { variantId: 23, variantLabel: variantLabel(VARIANTS[22]), qty: 2, unitPrice: 25.99, lineTotal: 51.98 },
      { variantId: 33, variantLabel: variantLabel(VARIANTS[32]), qty: 3, unitPrice: 19.99, lineTotal: 59.97 },
    ],
    createdAt: "2026-03-19",
  },
  {
    id: 11, orderRef: "ORD-011", customerName: "Isabella Turner", customerPhone: "07700900011",
    couponCode: null, subtotal: 35.97, discountAmount: 0,    total: 35.97, status: "Pending",
    items: [
      { variantId: 44, variantLabel: variantLabel(VARIANTS[43]), qty: 2, unitPrice: 11.99, lineTotal: 23.98 },
      { variantId: 35, variantLabel: variantLabel(VARIANTS[34]), qty: 1, unitPrice: 8.99,  lineTotal: 8.99  },
    ],
    createdAt: "2026-03-20",
  },
  {
    id: 12, orderRef: "ORD-012", customerName: "Lucas Green",    customerPhone: "07700900012",
    couponCode: null, subtotal: 66.97, discountAmount: 0,    total: 66.97, status: "Pending",
    items: [
      { variantId: 26, variantLabel: variantLabel(VARIANTS[25]), qty: 1, unitPrice: 36.99, lineTotal: 36.99 },
      { variantId: 9,  variantLabel: variantLabel(VARIANTS[8]),  qty: 1, unitPrice: 37.99, lineTotal: 37.99 },
    ],
    createdAt: "2026-03-21",
  },
  {
    id: 13, orderRef: "ORD-013", customerName: "Maya Patel",     customerPhone: "07700900013",
    couponCode: null, subtotal: 35.96, discountAmount: 0,    total: 35.96, status: "Completed",
    items: [
      { variantId: 47, variantLabel: variantLabel(VARIANTS[46]), qty: 2, unitPrice: 14.99, lineTotal: 29.98 },
      { variantId: 43, variantLabel: variantLabel(VARIANTS[42]), qty: 1, unitPrice: 11.99, lineTotal: 11.99 },
    ],
    createdAt: "2026-03-22",
  },
  {
    id: 14, orderRef: "ORD-014", customerName: "Noah Baker",     customerPhone: "07700900014",
    couponCode: null, subtotal: 38.99, discountAmount: 0,    total: 38.99, status: "Cancelled",
    items: [
      { variantId: 29, variantLabel: variantLabel(VARIANTS[28]), qty: 1, unitPrice: 38.99, lineTotal: 38.99 },
    ],
    createdAt: "2026-03-22",
  },
  {
    id: 15, orderRef: "ORD-015", customerName: "Olivia Scott",   customerPhone: "07700900015",
    couponCode: "FLAT5", subtotal: 72.95, discountAmount: 5.00, total: 67.95, status: "Pending",
    items: [
      { variantId: 3,  variantLabel: variantLabel(VARIANTS[2]),  qty: 3, unitPrice: 22.99, lineTotal: 68.97 },
      { variantId: 32, variantLabel: variantLabel(VARIANTS[31]), qty: 2, unitPrice: 19.99, lineTotal: 39.98 },
    ],
    createdAt: "2026-03-23",
  },
];

// ─────────────────────────────────────────────
// COUPON CODES
// ─────────────────────────────────────────────

export interface CouponCode {
  id: number;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderValue: number | null;
  expiryDate: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
}

export const COUPON_CODES: CouponCode[] = [
  { id: 1, code: "SUMMER10",  type: "percent", value: 10, minOrderValue: 20,   expiryDate: "2026-08-31", usageLimit: 50,   usedCount: 14, isActive: true },
  { id: 2, code: "FLAT5",     type: "fixed",   value: 5,  minOrderValue: 30,   expiryDate: null,         usageLimit: null, usedCount: 9,  isActive: true },
  { id: 3, code: "WELCOME15", type: "percent", value: 15, minOrderValue: null, expiryDate: "2026-12-31", usageLimit: 10,   usedCount: 3,  isActive: true },
  { id: 4, code: "VIP20",     type: "percent", value: 20, minOrderValue: 50,   expiryDate: "2026-06-30", usageLimit: 20,   usedCount: 5,  isActive: true },
  { id: 5, code: "NEWUSER",   type: "fixed",   value: 3,  minOrderValue: null, expiryDate: "2025-12-31", usageLimit: 100,  usedCount: 42, isActive: false },
];

// ─────────────────────────────────────────────
// REVENUE & PROFIT DATA
// ─────────────────────────────────────────────

export interface RevenueDataPoint {
  month?: string;
  day?: string;
  revenue: number;
  cost: number;
  profit: number;
}

export const MONTHLY_REVENUE: RevenueDataPoint[] = [
  { month: "Jan", revenue: 3840, cost: 1920, profit: 1920 },
  { month: "Feb", revenue: 4210, cost: 2050, profit: 2160 },
  { month: "Mar", revenue: 5150, cost: 2400, profit: 2750 },
  { month: "Apr", revenue: 4680, cost: 2200, profit: 2480 },
  { month: "May", revenue: 5920, cost: 2700, profit: 3220 },
  { month: "Jun", revenue: 6300, cost: 2900, profit: 3400 },
  { month: "Jul", revenue: 5450, cost: 2550, profit: 2900 },
  { month: "Aug", revenue: 6810, cost: 3100, profit: 3710 },
  { month: "Sep", revenue: 7120, cost: 3200, profit: 3920 },
  { month: "Oct", revenue: 8540, cost: 3800, profit: 4740 },
  { month: "Nov", revenue: 9200, cost: 4100, profit: 5100 },
  { month: "Dec", revenue: 11800, cost: 5200, profit: 6600 },
];

// Daily revenue for March 2026
export const DAILY_REVENUE: RevenueDataPoint[] = Array.from({ length: 23 }, (_, i) => {
  const day = i + 1;
  const base = 120 + Math.sin(i * 0.7) * 60 + (day % 7 === 0 ? 200 : 0);
  const revenue = Math.round(base + Math.random() * 80);
  const cost = Math.round(revenue * 0.45);
  return {
    day: String(day),
    revenue,
    cost,
    profit: revenue - cost,
  };
});

// ─────────────────────────────────────────────
// HELPER: LOW STOCK COUNT
// ─────────────────────────────────────────────

export function getLowStockCount(variants: Variant[]): number {
  return variants.filter((v) => v.stockQty <= v.lowStockThreshold).length;
}

export function getStockStatus(variant: Variant): "In Stock" | "Low Stock" | "Out of Stock" {
  if (variant.stockQty === 0) return "Out of Stock";
  if (variant.stockQty <= variant.lowStockThreshold) return "Low Stock";
  return "In Stock";
}

export function formatVariantLabel(v: Variant): string {
  return `${v.category} / ${v.type}${v.size !== "N/A" ? ` / ${v.size}` : ""} / ${v.color}`;
}
