"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Breadcrumbs,
  Container,
  FormControlLabel,
  Pagination,
  Skeleton,
  Switch,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
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

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const accent = "#C9A84C";
  const textPrimary = isDark ? "#F0EDE8" : "#0F1A2A";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#2C3A4E", 0.68);

  const [variants, setVariants] = useState<PublicVariant[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [inStockOnly, setInStockOnly] = useState(false);

  const formatPrice = useCallback(
    (value: number) => {
      const symbol = CURRENCY_SYMBOLS[settings?.currencyCode ?? "LKR"] ?? "Rs.";
      return `${symbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [settings],
  );

  // Load category info and settings once
  useEffect(() => {
    publicApi
      .getCategories()
      .then((r) => {
        const found = (r.data ?? []).find((c: Category) => c._id === id);
        if (found) setCategory(found);
      })
      .catch(() => {});
    publicApi.getSettings().then((r) => setSettings(r.data)).catch(() => {});
  }, [id]);

  // Load variants when filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: Record<string, string> = {
      category: id,
      page: String(page),
      limit: "24",
    };
    if (inStockOnly) params.inStock = "true";

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
  }, [id, page, inStockOnly]);

  const handleInStockToggle = () => {
    setInStockOnly((prev) => !prev);
    setPage(1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: 14, color: textMuted }} />}
        sx={{ mb: 2 }}
      >
        <Typography
          component={Link}
          href="/"
          sx={{
            fontSize: "0.78rem",
            color: textMuted,
            textDecoration: "none",
            "&:hover": { color: accent },
          }}
        >
          Home
        </Typography>
        <Typography
          component={Link}
          href="/shop"
          sx={{
            fontSize: "0.78rem",
            color: textMuted,
            textDecoration: "none",
            "&:hover": { color: accent },
          }}
        >
          Shop
        </Typography>
        <Typography
          sx={{ fontSize: "0.78rem", color: textPrimary, fontWeight: 600 }}
        >
          {category?.name ?? "Category"}
        </Typography>
      </Breadcrumbs>

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
          Category
        </Typography>
        <Typography
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            fontSize: { xs: "1.8rem", md: "2.6rem" },
            color: textPrimary,
            textTransform: "capitalize",
          }}
        >
          {category?.name ?? "..."}
        </Typography>
        {category?.description && (
          <Typography
            sx={{
              color: textMuted,
              fontSize: "0.9rem",
              mt: 1,
              maxWidth: "60ch",
            }}
          >
            {category.description}
          </Typography>
        )}
      </Box>

      {/* Filters */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
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

        {!loading && (
          <Typography sx={{ fontSize: "0.78rem", color: textMuted }}>
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
              : "No products in this category yet."}
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
