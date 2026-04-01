import { getCustomerToken } from "./customerAuth";
import type { CustomerProfile } from "./customerAuth";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";

const authHeaders = (): HeadersInit => {
  const token = getCustomerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return json;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  success: boolean;
  token: string;
  customer: CustomerProfile;
}

export const customerApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    province?: string;
    district?: string;
    city?: string;
  }) =>
    request<AuthResponse>("/public/customer/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/public/customer/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () =>
    request<{ success: boolean; customer: CustomerProfile }>("/public/customer/me"),

  updateProfile: (data: {
    name?: string;
    phone?: string;
    address?: string;
    province?: string;
    district?: string;
    city?: string;
  }) =>
    request<{ success: boolean; customer: CustomerProfile }>("/public/customer/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // ─── Orders ─────────────────────────────────────────────────────────────

  getOrders: (page = 1, limit = 10) =>
    request<{
      success: boolean;
      data: CustomerOrder[];
      pagination: { total: number; page: number; limit: number; pages: number };
    }>(`/public/customer/orders?page=${page}&limit=${limit}`),

  getOrderById: (id: string) =>
    request<{ success: boolean; data: CustomerOrder }>(`/public/customer/orders/${id}`),
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CustomerOrderItem {
  variantLabel: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  lineFinal: number;
  variant?: { images?: { url: string }[]; sku?: string } | null;
}

export interface CustomerOrder {
  _id: string;
  orderRef: string;
  customerName: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  paymentMethod: "COD" | "BankTransfer";
  status: "Pending" | "Completed" | "Cancelled" | "Deleted";
  items: CustomerOrderItem[];
  createdAt: string;
}
