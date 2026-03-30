/*
  MADLAXUE API CLIENT
  ===================
  Pre-built typed methods for every backend endpoint.
  Set NEXT_PUBLIC_API_URL in .env.local to override the base URL.

  Example replacement:
    BEFORE: import { VARIANTS } from '@/data/dummy'
    AFTER:  const { data } = await api.getVariants()
*/

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api';

// ─── Core fetch wrapper ───────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const token = typeof window !== 'undefined' ? localStorage.getItem('madlaxue_token') : null;

  const headers: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string>) };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('madlaxue_token');
        window.location.href = '/authentication/login';
      }
      throw new Error('Session expired');
    }
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Shared Types ─────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PopulatedRef {
  _id: string;
  name: string;
}

export interface ColorRef extends PopulatedRef {
  hexCode?: string;
}

export interface VariantImage {
  _id: string;
  fileId: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Variant {
  _id: string;
  sku: string;
  category: PopulatedRef;
  productType: PopulatedRef;
  color: ColorRef;
  size: string;
  costPrice: number;
  sellPrice: number;
  stockQty: number;
  lowStockThreshold: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  images: VariantImage[];
  isActive: boolean;
  createdAt: string;
}

export interface StockMovement {
  _id: string;
  variant: Partial<Variant>;
  type: 'IN' | 'OUT' | 'ADJUST';
  adjustDirection: 'add' | 'reduce' | null;
  qty: number;
  qtyBefore: number;
  qtyAfter: number;
  costPrice: number | null;
  sellPrice: number | null;
  qtyRemaining: number | null; // FIFO: remaining units in this batch (only for 'IN' movements)
  reason: string;
  orderId: string | null;
  supplier: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface OrderItem {
  variant: Partial<Variant>;
  variantLabel: string;
  qty: number;
  unitPrice: number;
  costPrice: number;
  lineTotal: number;
  discountType: 'percent' | 'fixed' | null;
  discount: number;
  discountAmount: number;
  lineFinal: number;
  batchSourceMovementId: string | null; // FIFO: which stock-in batch this came from
  batchCostPrice: number | null;        // FIFO: actual cost from that batch
  batchSellPrice: number | null;       // FIFO: sell price from batch allocation
  batchAllocations?: { batchId: string; qty: number }[];
}

export interface Order {
  _id: string;
  orderRef: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerSecondaryPhone?: string;
  items: OrderItem[];
  subtotal: number;
  itemDiscountAmount: number;
  couponCode: string;
  discountAmount: number;
  manualDiscountType: 'percent' | 'fixed' | null;
  manualDiscount: number;
  manualDiscountAmount: number;
  total: number;
  paymentMethod: 'COD' | 'BankTransfer';
  deliveryFee: number;
  status: 'Pending' | 'Completed' | 'Cancelled' | 'Deleted';
  createdAt: string;
}

export type OrderPriority = 'Normal' | 'Urgent' | 'Top Urgent';

export type OrderWithPriority = Order & {
  orderPriority?: OrderPriority;
};

export interface CreateOrderItem {
  variantId: string;
  qty: number;
  discountType?: 'percent' | 'fixed' | null;
  discount?: number;
}

export interface CreateOrderInput {
  customerName?: string;
  customerPhone?: string;
  customerAddress: string;
  customerSecondaryPhone?: string;
  items: CreateOrderItem[];
  couponCode?: string;
  manualDiscount?: number;
  manualDiscountType?: 'percent' | 'fixed' | null;
  paymentMethod?: 'COD' | 'BankTransfer';
  deliveryFee?: number;
  notes?: string;
}

export interface CouponValidation {
  valid: boolean;
  reason?: string;
  coupon?: {
    _id: string;
    code: string;
    type: 'percent' | 'fixed';
    value: number;
  };
  discountAmount?: number;
}

export interface FinanceSummary {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  codReceivable: number;
  codOrderCount: number;
  manualIncomeTotal: number;
  manualExpenseTotal: number;
  manualEntryCount: number;
  chartData: { label: string; revenue: number; cost: number; profit: number }[];
}

export interface GeneralSettings {
  _id?: string;
  currencyCode: 'LKR' | 'USD' | 'EUR' | 'GBP';
  timezone: string;
  defaultLowStockThreshold: number;
  defaultDeliveryFee: number;
  sellerWhatsappPhone: string;
}

export interface ImageAsset {
  fileId: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
}

export interface WebsiteHeroSlide {
  _id?: string;
  title: string;
  subtitle: string;
  image?: ImageAsset | null;
  sortOrder: number;
}

export interface WebsiteSettings {
  _id?: string;
  key?: string;
  heroSlides: WebsiteHeroSlide[];
}

export interface ManualFinanceEntry {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  reason: string;
  entryDate: string;
  createdBy?: { _id: string; username: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateManualFinanceEntryInput {
  type: 'income' | 'expense';
  amount: number;
  reason: string;
  entryDate: string;
}

export interface UpdateManualFinanceEntryInput extends CreateManualFinanceEntryInput {}

export interface DashboardStats {
  totalVariants: number;
  stockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  todayRevenue: number;
  monthlyProfit: number;
  monthOrders: number;
  recentMovements: unknown[];
  topSelling: { variant: Variant; totalQtySold: number; totalRevenue: number }[];
}

export interface PublicVariant {
  _id: string;
  sku: string;
  category: PopulatedRef;
  productType: PopulatedRef;
  color: ColorRef;
  size: string;
  sellPrice: number;
  stockQty: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  images: VariantImage[];
  createdAt: string;
}

export interface PublicBatch {
  _id: string;
  batchId: string;
  createdAt: string;
  sellPrice: number;
  qtyRemaining: number;
  variant: PublicVariant;
}

export interface PublicSettings {
  currencyCode: 'LKR' | 'USD' | 'EUR' | 'GBP';
  timezone: string;
  defaultDeliveryFee: number;
  sellerWhatsappPhone: string;
}

export interface PublicCreateOrderItem {
  variantId: string;
  batchId: string;
  qty: number;
}

export interface PublicCreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: 'COD' | 'BankTransfer';
  deliveryFee?: number;
  items: PublicCreateOrderItem[];
}

export interface PublicTopSellingItem {
  variant: Variant;
  totalQtySold: number;
  totalRevenue: number;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  landingImage?: {
    fileId: string;
    filename: string;
    contentType: string;
    size: number;
    url: string;
  };
  isActive: boolean;
}

// ─── Public API (no auth) ─────────────────────────────────────────────────

async function publicRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const headers: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string>) };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const publicApi = {
  getBatches: (params?: Record<string, string>) =>
    publicRequest<PaginatedResponse<PublicBatch>>(
      '/public/batches?' + new URLSearchParams(params ?? {})
    ),
  getVariants: (params?: Record<string, string>) =>
    publicRequest<PaginatedResponse<PublicVariant>>(
      '/public/variants?' + new URLSearchParams(params ?? {})
    ),
  getVariantById: (id: string) =>
    publicRequest<ApiResponse<PublicVariant>>(`/public/variants/${id}`),
  getProductTypes: (categoryId?: string) =>
    publicRequest<ApiResponse<Array<{ _id: string; name: string; category: PopulatedRef }>>>(
      '/public/product-types' + (categoryId ? `?category=${categoryId}` : '')
    ),
  getCategories: () =>
    publicRequest<ApiResponse<Category[]>>('/public/categories'),
  getSettings: () =>
    publicRequest<ApiResponse<PublicSettings>>('/public/settings'),
  getTopSelling: (limit = 6) =>
    publicRequest<ApiResponse<PublicTopSellingItem[]>>(`/public/top-selling?limit=${limit}`),
  createOrder: (data: PublicCreateOrderInput) =>
    publicRequest<ApiResponse<Order>>('/public/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── API Methods ──────────────────────────────────────────────────────────

export const api = {
  // Auth — apiResponse.js spreads data flat, so no .data wrapper
  auth: {
    login: (username: string, password: string) =>
      request<{ success: boolean; message: string; token: string; user: { id: string; username: string; role: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ username, password }) }
      ),
    me: () => request<{ success: boolean; message: string; user: { id: string; username: string; role: string } }>('/auth/me'),
    logout: () => request<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' }),
  },

  // Dashboard
  getDashboardStats: () =>
    request<ApiResponse<DashboardStats>>('/dashboard/stats'),

  // Variants
  getVariants: (params?: Record<string, string>) =>
    request<PaginatedResponse<Variant>>(
      '/variants?' + new URLSearchParams(params ?? {})
    ),
  getVariant: (id: string) =>
    request<ApiResponse<Variant>>(`/variants/${id}`),
  getLowStockCount: () =>
    request<{ count: number }>('/variants/low-stock/count'),
  createVariant: (data:
    | FormData
    | {
        categoryId: string;
        productTypeId: string;
        colorId: string;
        size?: string;
        costPrice: number;
        sellPrice: number;
        stockQty?: number;
        lowStockThreshold?: number;
      }) => request<ApiResponse<Variant>>('/variants', {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  updateVariant: (id: string, data: Partial<Variant>) =>
    request<ApiResponse<Variant>>(`/variants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVariant: (id: string) =>
    request<ApiResponse<Variant>>(`/variants/${id}`, { method: 'DELETE' }),

  // Stock Movements
  getMovements: (params?: Record<string, string>) =>
    request<PaginatedResponse<StockMovement>>(
      '/stock-movements?' + new URLSearchParams(params ?? {})
    ),
  stockIn: (data: {
    variantId: string;
    qty: number;
    costPrice: number;
    sellPrice?: number;
    supplier?: string;
    notes?: string;
  }) =>
    request<ApiResponse<unknown>>('/stock-movements/stock-in', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adjust: (data: {
    variantId: string;
    adjustDirection: 'add' | 'reduce';
    qty: number;
    reason: string;
    notes?: string;
    movementId?: string;
  }) =>
    request<ApiResponse<unknown>>('/stock-movements/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getActiveBatches: (params?: Record<string, string>) =>
    request<PaginatedResponse<StockMovement>>(
      '/stock-movements/active-batches?' + new URLSearchParams(params ?? {})
    ),

  // Orders
  getOrders: (params?: Record<string, string>) =>
    request<PaginatedResponse<Order>>('/orders?' + new URLSearchParams(params ?? {})),
  getOrder: (id: string) =>
    request<ApiResponse<Order>>(`/orders/${id}`),
  createOrder: (data: CreateOrderInput) =>
    request<ApiResponse<Order>>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  cancelOrder: (id: string) =>
    request<ApiResponse<Order>>(`/orders/${id}/cancel`, { method: 'PATCH' }),
  completeOrder: (id: string) =>
    request<ApiResponse<Order>>(`/orders/${id}/complete`, { method: 'PATCH' }),
  deleteOrder: (id: string) =>
    request<ApiResponse<Order>>(`/orders/${id}`, { method: 'DELETE' }),

  // Coupons
  getCoupons: (params?: Record<string, string>) =>
    request<ApiResponse<unknown[]>>('/coupons?' + new URLSearchParams(params ?? {})),
  createCoupon: (data: unknown) =>
    request<ApiResponse<unknown>>('/coupons', { method: 'POST', body: JSON.stringify(data) }),
  updateCoupon: (id: string, data: unknown) =>
    request<ApiResponse<unknown>>(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleCoupon: (id: string) =>
    request<ApiResponse<unknown>>(`/coupons/${id}/toggle`, { method: 'PATCH' }),
  deleteCoupon: (id: string) =>
    request<ApiResponse<unknown>>(`/coupons/${id}`, { method: 'DELETE' }),
  validateCoupon: (code: string, orderSubtotal: number) =>
    request<CouponValidation>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, orderSubtotal }),
    }),

  // Finance
  getFinanceSummary: (params?: Record<string, string>) =>
    request<ApiResponse<FinanceSummary>>('/finance/summary?' + new URLSearchParams(params ?? {})),
  getFinanceBreakdown: (params?: Record<string, string>) =>
    request<PaginatedResponse<unknown>>('/finance/breakdown?' + new URLSearchParams(params ?? {})),
  getTopSelling: (params?: Record<string, string>) =>
    request<ApiResponse<unknown[]>>('/finance/top-selling?' + new URLSearchParams(params ?? {})),
  getManualFinanceEntries: (params?: Record<string, string>) =>
    request<PaginatedResponse<ManualFinanceEntry>>('/finance/manual-entries?' + new URLSearchParams(params ?? {})),
  createManualFinanceEntry: (data: CreateManualFinanceEntryInput) =>
    request<ApiResponse<ManualFinanceEntry>>('/finance/manual-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateManualFinanceEntry: (id: string, data: UpdateManualFinanceEntryInput) =>
    request<ApiResponse<ManualFinanceEntry>>(`/finance/manual-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteManualFinanceEntry: (id: string) =>
    request<ApiResponse<unknown>>(`/finance/manual-entries/${id}`, {
      method: 'DELETE',
    }),

  // General settings
  getGeneralSettings: () =>
    request<ApiResponse<GeneralSettings>>('/settings/general'),
  updateGeneralSettings: (data: Omit<GeneralSettings, '_id'> | GeneralSettings) =>
    request<ApiResponse<GeneralSettings>>('/settings/general', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getWebsiteSettings: () =>
    request<ApiResponse<WebsiteSettings>>('/settings/website'),
  updateWebsiteSettings: (data: Pick<WebsiteSettings, 'heroSlides'>) =>
    request<ApiResponse<WebsiteSettings>>('/settings/website', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadWebsiteHeroImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return request<ApiResponse<ImageAsset>>('/settings/website/hero-image', {
      method: 'POST',
      body: form,
    });
  },

  // Categories
  getCategories: () => request<ApiResponse<unknown[]>>('/categories'),
  createCategory: (data: { name: string; description?: string }) =>
    request<ApiResponse<unknown>>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: unknown) =>
    request<ApiResponse<unknown>>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    request<ApiResponse<unknown>>(`/categories/${id}`, { method: 'DELETE' }),
  uploadCategoryLandingImage: (categoryId: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return request<ApiResponse<unknown>>(`/categories/${categoryId}/landing-image`, {
      method: 'POST',
      body: form,
    });
  },
  deleteCategoryLandingImage: (categoryId: string) =>
    request<ApiResponse<unknown>>(`/categories/${categoryId}/landing-image`, {
      method: 'DELETE',
    }),

  // Product Types
  getProductTypes: (categoryId?: string) =>
    request<ApiResponse<unknown[]>>(
      '/product-types' + (categoryId ? `?category=${categoryId}` : '')
    ),
  createProductType: (data: { name: string; category: string; hasSizes?: boolean; sizes?: string[] }) =>
    request<ApiResponse<unknown>>('/product-types', { method: 'POST', body: JSON.stringify(data) }),
  updateProductType: (id: string, data: { name?: string; hasSizes?: boolean; sizes?: string[] }) =>
    request<ApiResponse<unknown>>(`/product-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProductType: (id: string) =>
    request<ApiResponse<unknown>>(`/product-types/${id}`, { method: 'DELETE' }),

  // Colors
  getColors: () => request<ApiResponse<unknown[]>>('/colors'),
  createColor: (data: { name: string; hexCode?: string }) =>
    request<ApiResponse<unknown>>('/colors', { method: 'POST', body: JSON.stringify(data) }),
  updateColor: (id: string, data: { name?: string; hexCode?: string }) =>
    request<ApiResponse<unknown>>(`/colors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteColor: (id: string) =>
    request<ApiResponse<unknown>>(`/colors/${id}`, { method: 'DELETE' }),

  // Images
  uploadImages: (variantId: string, files: FileList | File[]) => {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('images', f));
    return request<ApiResponse<VariantImage[]>>(`/images/upload/${variantId}`, {
      method: 'POST',
      body: form,
    });
  },
  setPrimaryImage: (variantId: string, imageId: string) =>
    request<ApiResponse<VariantImage[]>>(`/images/${variantId}/primary/${imageId}`, {
      method: 'PUT',
    }),
  deleteImage: (variantId: string, imageId: string) =>
    request<ApiResponse<VariantImage[]>>(`/images/${variantId}/${imageId}`, {
      method: 'DELETE',
    }),
};
