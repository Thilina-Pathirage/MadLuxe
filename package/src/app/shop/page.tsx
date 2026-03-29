"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Pagination,
  Skeleton,
  Switch,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ProductCard from "@/components/shop/ProductCard";
import {
  publicApi,
  type Category,
  type PublicVariant,
  type PublicSettings,
} from "@/lib/api";

const CURRENCY_SYMBOLS: Record<string, string> = {
  LKR: "Rs.",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
};

export default function ShopAllPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const accent = "#C9A84C";
  const textPrimary = isDark ? "#F0EDE8" : "#0F1A2A";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#2C3A4E", 0.68);

  const [variants, setVariants] = useState<PublicVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const formatPrice = useCallback(
    (value: number) => {
      const symbol = CURRENCY_SYMBOLS[settings?.currencyCode ?? "LKR"] ?? "Rs.";
      return `${symbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [settings],
  );

  // Load categories and settings once
  useEffect(() => {
    publicApi.getCategories().then((r) => setCategories(r.data ?? [])).catch(() => {});
    publicApi.getSettings().then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  // Load variants when filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: Record<string, string> = {
      page: String(page),
      limit: "24",
    };
    if (inStockOnly) params.inStock = "true";
    if (selectedCategory) params.category = selectedCategory;

    publicApi
      .getVariants(params)
      .then((r) => {
        if (cancelled) return;
        setVariants(r.data ?? []);
        setTotal(r.total ?? 0);
        setTotalPages(r.totalPages ?? 1);
      })
      .catch(() => {
        if (!cancelled) setVariants([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, inStockOnly, selectedCategory]);

  const handleCategoryToggle = (catId: string) => {
    setSelectedCategory((prev) => (prev === catId ? null : catId));
    setPage(1);
  };

  const handleInStockToggle = () => {
    setInStockOnly((prev) => !prev);
    setPage(1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Typography
          sx={{
            fontSize: "0.68rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: accent,
            fontWeight: 600,
            mb: 1.2,
          }}
        >
          Our Collection
        </Typography>
        <Typography
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            fontSize: { xs: "1.8rem", md: "2.6rem" },
            color: textPrimary,
          }}
        >
          Shop All Products
        </Typography>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
          pb: 2.5,
          borderBottom: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#0F1A2A", 0.08)}`,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={inStockOnly}
              onChange={handleInStockToggle}
              size="small"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: accent },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  bgcolor: alpha(accent, 0.5),
                },
              }}
            />
          }
          label={
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: textMuted }}>
              In Stock Only
            </Typography>
          }
        />

        <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", flex: 1 }}>
          {categories.map((cat) => (
            <Chip
              key={cat._id}
              label={cat.name}
              size="small"
              clickable
              onClick={() => handleCategoryToggle(cat._id)}
              sx={{
                fontSize: "0.72rem",
                fontWeight: 600,
                borderRadius: "6px",
                bgcolor:
                  selectedCategory === cat._id
                    ? alpha(accent, 0.18)
                    : isDark
                      ? alpha("#FFFFFF", 0.06)
                      : alpha("#0F1A2A", 0.05),
                color:
                  selectedCategory === cat._id
                    ? accent
                    : textMuted,
                border: `1px solid ${
                  selectedCategory === cat._id
                    ? alpha(accent, 0.4)
                    : "transparent"
                }`,
                "&:hover": {
                  bgcolor: alpha(accent, 0.12),
                },
              }}
            />
          ))}
        </Box>

        {!loading && (
          <Typography sx={{ fontSize: "0.78rem", color: textMuted, whiteSpace: "nowrap" }}>
            {total} product{total !== 1 ? "s" : ""}
          </Typography>
        )}
      </Box>

      {/* Product Grid */}
      {loading ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
            gap: { xs: 1.8, md: 2.2 },
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Box
              key={`skel-${i}`}
              sx={{
                borderRadius: "14px",
                overflow: "hidden",
                bgcolor: isDark ? alpha("#0D1825", 0.7) : "#FFFFFF",
                border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#0F1A2A", 0.08)}`,
              }}
            >
              <Skeleton variant="rectangular" height={240} />
              <Box sx={{ p: 2 }}>
                <Skeleton width="70%" height={22} />
                <Skeleton width="40%" height={16} sx={{ mt: 0.5 }} />
                <Skeleton width="50%" height={28} sx={{ mt: 1.5 }} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : variants.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Typography sx={{ fontSize: "1.1rem", color: textMuted, fontWeight: 500 }}>
            No products found
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", color: alpha(textMuted, 0.7), mt: 1 }}>
            {inStockOnly
              ? "Try turning off the \"In Stock Only\" filter."
              : "Check back soon for new arrivals."}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
            gap: { xs: 1.8, md: 2.2 },
          }}
        >
          {variants.map((v) => (
            <ProductCard key={v._id} variant={v} formatPrice={formatPrice} />
          ))}
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            shape="rounded"
            sx={{
              "& .MuiPaginationItem-root": {
                color: textMuted,
                fontWeight: 600,
                fontSize: "0.82rem",
                "&.Mui-selected": {
                  bgcolor: alpha(accent, 0.18),
                  color: accent,
                  "&:hover": { bgcolor: alpha(accent, 0.28) },
                },
              },
            }}
          />
        </Box>
      )}
    </Container>
  );
}
