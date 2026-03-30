"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { publicApi, type PublicSettings } from "@/lib/api";
import {
  getPublicCartSubtotal,
  removePublicCartItem,
  setPublicCartItemQty,
  usePublicCartItems,
} from "@/lib/publicCart";

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

  const items = usePublicCartItems();
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    publicApi.getSettings().then((res) => setSettings(res.data)).catch(() => {});
  }, []);

  const formatPrice = useCallback(
    (value: number) => {
      const symbol = CURRENCY_SYMBOLS[settings?.currencyCode ?? "LKR"] ?? "Rs.";
      return `${symbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [settings],
  );

  const total = useMemo(() => getPublicCartSubtotal(items), [items]);

  const decreaseQty = (lineId: string, currentQty: number) => {
    if (currentQty <= 1) {
      removePublicCartItem(lineId);
      return;
    }
    setPublicCartItemQty(lineId, currentQty - 1);
  };

  const increaseQty = (lineId: string, currentQty: number, maxQtyAtSelection: number) => {
    setPublicCartItemQty(lineId, Math.min(currentQty + 1, maxQtyAtSelection));
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
        <Button
          component={Link}
          href="/shop"
          variant="contained"
          sx={{ mt: 2.2, textTransform: "none", fontWeight: 700, bgcolor: accent, color: "#0F1A2A", "&:hover": { bgcolor: "#D4B060" } }}
        >
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
          <Box key={item.lineId}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "72px 1fr auto", md: "84px 1fr auto" },
                gap: 1.4,
                p: 1.6,
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: { xs: 72, md: 84 },
                  height: { xs: 72, md: 84 },
                  borderRadius: "10px",
                  backgroundImage: item.imageUrl
                    ? `url(${item.imageUrl})`
                    : "linear-gradient(145deg, #1D3557 0%, #2A9D8F 54%, #E9C46A 100%)",
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
                <Typography sx={{ mt: 0.4, color: textMuted, fontSize: "0.74rem" }}>
                  Stock {item.batchLabel}
                </Typography>

                <Box sx={{ mt: 0.8, display: "inline-flex", alignItems: "center", border: `1px solid ${alpha(accent, 0.45)}`, borderRadius: "8px", overflow: "hidden" }}>
                  <IconButton
                    aria-label="Decrease quantity"
                    onClick={() => decreaseQty(item.lineId, item.qty)}
                    sx={{ borderRadius: 0, width: 34, height: 34 }}
                  >
                    <RemoveRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <Typography sx={{ minWidth: 34, textAlign: "center", fontWeight: 700, color: textPrimary, fontSize: "0.85rem" }}>
                    {item.qty}
                  </Typography>
                  <IconButton
                    aria-label="Increase quantity"
                    onClick={() => increaseQty(item.lineId, item.qty, item.maxQtyAtSelection)}
                    disabled={item.qty >= item.maxQtyAtSelection}
                    sx={{ borderRadius: 0, width: 34, height: 34 }}
                  >
                    <AddRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ textAlign: "right" }}>
                <Typography sx={{ color: textPrimary, fontWeight: 800, fontSize: "0.95rem" }}>
                  {formatPrice(item.unitPrice * item.qty)}
                </Typography>
                <Typography sx={{ mt: 0.4, color: accent, fontWeight: 700, fontSize: "0.8rem" }}>
                  {formatPrice(item.unitPrice)} each
                </Typography>
                <IconButton
                  onClick={() => removePublicCartItem(item.lineId)}
                  sx={{ mt: 0.6, color: isDark ? alpha("#FFFFFF", 0.7) : alpha("#0F1A2A", 0.65) }}
                >
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
        component={Link}
        href="/shop/checkout"
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
        Proceed to Checkout
      </Button>
    </Container>
  );
}
