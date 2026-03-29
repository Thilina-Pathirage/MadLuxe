import {
  IconLayoutDashboard,
  IconBox,
  IconShoppingBag,
  IconReceipt,
  IconCash,
  IconAlertTriangle,
  IconHistory,
  IconSettings,
} from "@tabler/icons-react";
import { uniqueId } from "lodash";

const Menuitems = [
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/portal",
  },
  {
    id: uniqueId(),
    title: "Inventory",
    icon: IconBox,
    children: [
      { id: uniqueId(), title: "All Stock",   href: "/portal/inventory/all-stock"   },
      { id: uniqueId(), title: "Stock In",    href: "/portal/inventory/stock-in"    },
      { id: uniqueId(), title: "Stock Out",   href: "/portal/inventory/stock-out"   },
      { id: uniqueId(), title: "Adjustments", href: "/portal/inventory/adjustments" },
    ],
  },
  {
    id: uniqueId(),
    title: "Products",
    icon: IconShoppingBag,
    children: [
      { id: uniqueId(), title: "All Products", href: "/portal/products/all-products" },
      { id: uniqueId(), title: "Categories",   href: "/portal/products/categories"   },
      { id: uniqueId(), title: "Variants",     href: "/portal/products/variants"     },
    ],
  },
  {
    id: uniqueId(),
    title: "Orders",
    icon: IconReceipt,
    children: [
      { id: uniqueId(), title: "All Orders", href: "/portal/orders/all-orders" },
      { id: uniqueId(), title: "New Order",  href: "/portal/orders/new-order"  },
    ],
  },
  {
    id: uniqueId(),
    title: "Finance",
    icon: IconCash,
    children: [
      { id: uniqueId(), title: "Revenue & Profit", href: "/portal/finance/revenue-profit" },
      { id: uniqueId(), title: "Manual Entries",   href: "/portal/finance/manual-entries" },
      { id: uniqueId(), title: "Coupon Codes",     href: "/portal/finance/coupon-codes"   },
    ],
  },
  {
    id: uniqueId(),
    title: "Low Stock Alerts",
    icon: IconAlertTriangle,
    href: "/portal/alerts/low-stock",
  },
  {
    id: uniqueId(),
    title: "Stock History",
    icon: IconHistory,
    href: "/portal/reports/stock-history",
  },
  {
    id: uniqueId(),
    title: "Settings",
    icon: IconSettings,
    children: [
      { id: uniqueId(), title: "Product Config",   href: "/portal/settings/product-config" },
      { id: uniqueId(), title: "General Settings", href: "/portal/settings/general"        },
    ],
  },
];

export default Menuitems;
