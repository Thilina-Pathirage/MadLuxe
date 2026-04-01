"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface CustomerProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  city: string;
  createdAt?: string;
}

const TOKEN_KEY = "madlaxue_customer_token";

export const getCustomerToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setCustomerToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearCustomerToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// ─── Context ────────────────────────────────────────────────────────────────

interface CustomerAuthState {
  customer: CustomerProfile | null;
  loading: boolean;
  login: (token: string, profile: CustomerProfile) => void;
  logout: () => void;
  setCustomer: (profile: CustomerProfile) => void;
}

const CustomerAuthContext = createContext<CustomerAuthState>({
  customer: null,
  loading: true,
  login: () => {},
  logout: () => {},
  setCustomer: () => {},
});

export const useCustomerAuth = () => useContext(CustomerAuthContext);

// ─── Provider ───────────────────────────────────────────────────────────────

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomerState] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, verify stored token against /api/public/customer/me
  useEffect(() => {
    const token = getCustomerToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";
    fetch(`${baseUrl}/public/customer/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data?.success && data?.customer) {
          setCustomerState(data.customer);
        } else {
          clearCustomerToken();
        }
      })
      .catch(() => {
        clearCustomerToken();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token: string, profile: CustomerProfile) => {
    setCustomerToken(token);
    setCustomerState(profile);
  }, []);

  const logout = useCallback(() => {
    clearCustomerToken();
    setCustomerState(null);
  }, []);

  const setCustomer = useCallback((profile: CustomerProfile) => {
    setCustomerState(profile);
  }, []);

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, login, logout, setCustomer }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}
