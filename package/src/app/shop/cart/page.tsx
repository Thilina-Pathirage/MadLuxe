"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

const PUBLIC_CART_KEY = "madlaxue_public_cart";

type PublicCartItem = {
  variantId: string;
  sku: string;
  productName: string;
  categoryName?: string;
  colorName?: string;
  size?: string;
  unitPrice: number;
  imageUrl: string | null;
  qty: number;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  LKR: "Rs.",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
};

export default function ShopCartPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = "#C9A84C";
  const textPrimary = isDark ? "#F0EDE8" : "#0F1A2A";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#2C3A4E", 0.68);

  const [items, setItems] = useState<PublicCartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(PUBLIC_CART_KEY);
    if (!stored) return;
    try {
      setItems(JSON.parse(stored) as PublicCartItem[]);
    } catch {
      setItems([]);
    }
  }, []);

  const formatPrice = (value: number) =>
    `${CURRENCY_SYMBOLS.LKR} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
    [items],
  );

  const persist = (next: PublicCartItem[]) => {
    setItems(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(PUBLIC_CART_KEY, JSON.stringify(next));
    }
  };

  const removeItem = (variantId: string) => {
    persist(items.filter((item) => item.variantId !== variantId));
  };

  if (!items.length) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: { xs: "1.6rem", md: "2rem" } }}>
          Your cart is empty
        </Typography>
        <Typography sx={{ mt: 1, color: textMuted }}>
          Add products from the shop to continue.
        </Typography>
        <Button component={Link} href="/shop" variant="contained" sx={{ mt: 2.2, textTransform: "none", fontWeight: 700, bgcolor: accent, color: "#0F1A2A", "&:hover": { bgcolor: "#D4B060" } }}>
          Continue Shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: { xs: "1.6rem", md: "2.2rem" }, mb: 2.4 }}>
        Shopping Cart
      </Typography>

      <Box
        sx={{
          border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#0F1A2A", 0.08)}`,
          bgcolor: isDark ? alpha("#0D1825", 0.72) : "#FFFFFF",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {items.map((item, index) => (
          <Box key={item.variantId}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "72px 1fr auto", md: "84px 1fr auto" }, gap: 1.4, p: 1.6, alignItems: "center" }}>
              <Box
                sx={{
                  width: { xs: 72, md: 84 },
                  height: { xs: 72, md: 84 },
                  borderRadius: "10px",
                  backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : "linear-gradient(145deg, #1D3557 0%, #2A9D8F 54%, #E9C46A 100%)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              <Box>
                <Typography sx={{ color: textPrimary, fontWeight: 700, lineHeight: 1.2 }}>{item.productName}</Typography>
                <Typography sx={{ mt: 0.4, color: textMuted, fontSize: "0.82rem" }}>
                  {item.categoryName} · {item.colorName ?? "-"} {item.size && item.size !== "N/A" ? `· ${item.size}` : ""}
                </Typography>
                <Typography sx={{ mt: 0.4, color: textMuted, fontSize: "0.76rem", fontFamily: "monospace" }}>
                  {item.sku}
                </Typography>
                <Typography sx={{ mt: 0.7, color: accent, fontWeight: 700 }}>
                  {formatPrice(item.unitPrice)} x {item.qty}
                </Typography>
              </Box>

              <Box sx={{ textAlign: "right" }}>
                <Typography sx={{ color: textPrimary, fontWeight: 800, fontSize: "0.95rem" }}>
                  {formatPrice(item.unitPrice * item.qty)}
                </Typography>
                <IconButton onClick={() => removeItem(item.variantId)} sx={{ mt: 0.6, color: isDark ? alpha("#FFFFFF", 0.7) : alpha("#0F1A2A", 0.65) }}>
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            {index < items.length - 1 && <Divider />}
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 2.2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.2 }}>
        <Typography sx={{ color: textMuted, fontWeight: 600 }}>
          Total
        </Typography>
        <Typography sx={{ color: accent, fontWeight: 800, fontSize: "1.3rem" }}>
          {formatPrice(total)}
        </Typography>
      </Box>

      <Button
        fullWidth
        variant="contained"
        sx={{
          mt: 2,
          textTransform: "none",
          fontWeight: 700,
          py: 1.1,
          bgcolor: accent,
          color: "#0F1A2A",
          "&:hover": { bgcolor: "#D4B060" },
        }}
      >
        Proceed to Checkout (Coming Soon)
      </Button>
    </Container>
  );
}
