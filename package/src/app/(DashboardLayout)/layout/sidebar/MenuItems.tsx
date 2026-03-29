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
    href: "/",
  },
  {
    id: uniqueId(),
    title: "Inventory",
    icon: IconBox,
    children: [
      { id: uniqueId(), title: "All Stock",   href: "/inventory/all-stock"   },
      { id: uniqueId(), title: "Stock In",    href: "/inventory/stock-in"    },
      { id: uniqueId(), title: "Stock Out",   href: "/inventory/stock-out"   },
      { id: uniqueId(), title: "Adjustments", href: "/inventory/adjustments" },
    ],
  },
  {
    id: uniqueId(),
    title: "Products",
    icon: IconShoppingBag,
    children: [
      { id: uniqueId(), title: "All Products", href: "/products/all-products" },
      { id: uniqueId(), title: "Categories",   href: "/products/categories"   },
      { id: uniqueId(), title: "Variants",     href: "/products/variants"     },
    ],
  },
  {
    id: uniqueId(),
    title: "Orders",
    icon: IconReceipt,
    children: [
      { id: uniqueId(), title: "All Orders", href: "/orders/all-orders" },
      { id: uniqueId(), title: "New Order",  href: "/orders/new-order"  },
    ],
  },
  {
    id: uniqueId(),
    title: "Finance",
    icon: IconCash,
    children: [
      { id: uniqueId(), title: "Revenue & Profit", href: "/finance/revenue-profit" },
      { id: uniqueId(), title: "Manual Entries",   href: "/finance/manual-entries" },
      { id: uniqueId(), title: "Coupon Codes",     href: "/finance/coupon-codes"   },
    ],
  },
  {
    id: uniqueId(),
    title: "Low Stock Alerts",
    icon: IconAlertTriangle,
    href: "/alerts/low-stock",
  },
  {
    id: uniqueId(),
    title: "Stock History",
    icon: IconHistory,
    href: "/reports/stock-history",
  },
  {
    id: uniqueId(),
    title: "Settings",
    icon: IconSettings,
    children: [
      { id: uniqueId(), title: "Product Config",   href: "/settings/product-config" },
      { id: uniqueId(), title: "General Settings", href: "/settings/general"        },
    ],
  },
];

export default Menuitems;
