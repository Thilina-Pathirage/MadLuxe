"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Breadcrumbs,
  Container,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Switch,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchIcon from "@mui/icons-material/Search";
import ProductCard from "@/components/shop/ProductCard";
import {
  publicApi,
  type Category,
  type PublicBatch,
  type PublicSettings,
} from "@/lib/api";

const CURRENCY_SYMBOLS: Record<string, string> = {
  LKR: "Rs.",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
};

type ProductTypeOption = {
  _id: string;
  name: string;
  category: { _id: string; name: string };
};

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const accent = "#C9A84C";
  const textPrimary = isDark ? "#F0EDE8" : "#111111";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#333333", 0.68);

  const [batches, setBatches] = useState<PublicBatch[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<ProductTypeOption[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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

  // Load product types for this category
  useEffect(() => {
    let cancelled = false;
    setSelectedType(null);
    setPage(1);

    if (!id) {
      setProductTypes([]);
      setTypesLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setTypesLoading(true);
    publicApi
      .getProductTypes(id)
      .then((r) => {
        if (cancelled) return;
        setProductTypes((r.data as ProductTypeOption[]) ?? []);
      })
      .catch(() => {
        if (!cancelled) setProductTypes([]);
      })
      .finally(() => {
        if (!cancelled) setTypesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Load batches when filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: Record<string, string> = {
      category: id,
      page: String(page),
      limit: "24",
      inStock: inStockOnly ? "true" : "false",
    };
    if (selectedType) params.productType = selectedType;
    if (debouncedSearch) params.search = debouncedSearch;

    publicApi
      .getBatches(params)
      .then((r) => {
        if (cancelled) return;
        setBatches(r.data ?? []);
        setTotal(r.total ?? 0);
        setTotalPages(r.totalPages ?? 1);
      })
      .catch(() => {
        if (!cancelled) setBatches([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, page, inStockOnly, selectedType, debouncedSearch]);

  const handleInStockToggle = () => {
    setInStockOnly((prev) => !prev);
    setPage(1);
  };

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedType(value ? value : null);
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
          flexDirection: "column",
          gap: 2,
          mb: 3,
          p: { xs: 1.5, sm: 2 },
          borderRadius: "16px",
          bgcolor: isDark ? alpha("#FFFFFF", 0.03) : alpha("#FFFFFF", 0.84),
          backdropFilter: "blur(6px)",
          boxShadow: isDark ? "none" : "0 8px 24px rgba(15, 26, 42, 0.05)",
          border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.08)}`,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.66rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: textMuted,
            fontWeight: 700,
          }}
        >
          Refine Results
        </Typography>

        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            alignItems: { xs: "stretch", lg: "center" },
            gap: 1.5,
          }}
        >
          <TextField
            size="small"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            sx={{
              width: "100%",
              minWidth: 0,
              flex: 1,
              "& .MuiOutlinedInput-root": {
                height: { xs: 46, sm: 48 },
                borderRadius: "999px",
                bgcolor: isDark ? alpha("#FFFFFF", 0.04) : alpha("#FFFFFF", 0.96),
                pr: 0.4,
                transition: "all 0.2s ease",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDark ? alpha("#FFFFFF", 0.12) : alpha("#111111", 0.12),
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDark ? alpha("#FFFFFF", 0.2) : alpha("#111111", 0.22),
                },
                "&.Mui-focused": {
                  boxShadow: `0 0 0 3px ${alpha(accent, 0.2)}`,
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: alpha(accent, 0.8),
                  borderWidth: "1px",
                },
              },
              "& .MuiInputBase-input": {
                py: 0,
                fontSize: "0.9rem",
                color: textPrimary,
              },
              "& .MuiInputBase-input::placeholder": {
                color: textMuted,
                opacity: 1,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.06),
                    }}
                  >
                    <SearchIcon sx={{ fontSize: 18, color: textMuted }} />
                  </Box>
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Clear search"
                    size="small"
                    onClick={() => setSearchTerm("")}
                    sx={{
                      mr: 0.4,
                      color: textMuted,
                      "&:hover": {
                        bgcolor: isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.08),
                      },
                    }}
                  >
                    <CloseRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "flex-start", lg: "flex-end" },
              gap: 1,
              flexWrap: "wrap",
              minHeight: 46,
            }}
          >
            {!loading && (
              <Typography sx={{ fontSize: "0.78rem", color: textMuted, whiteSpace: "nowrap", px: 0.3 }}>
                {total} stock{total !== 1 ? "s" : ""}
              </Typography>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            width: "100%",
            display: "grid",
            gap: 1.5,
            pt: 1.2,
            borderTop: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.08)}`,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(2, minmax(0, 280px))" },
          }}
        >
          <FormControl size="small" sx={{ minWidth: 0 }}>
            <InputLabel id="category-page-type-select-label">Type</InputLabel>
            <Select
              labelId="category-page-type-select-label"
              value={selectedType ?? ""}
              label="Type"
              onChange={handleTypeChange}
              disabled={typesLoading || productTypes.length === 0}
              startAdornment={
                <LocalOfferOutlinedIcon
                  sx={{
                    fontSize: 26,
                    mr: 1,
                    color: selectedType ? accent : textMuted,
                  }}
                />
              }
              sx={{ borderRadius: "12px" }}
            >
              <MenuItem value="">All Types</MenuItem>
              {productTypes.map((type) => (
                <MenuItem key={type._id} value={type._id}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", alignItems: "center", minHeight: 48 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={inStockOnly}
                  onChange={handleInStockToggle}
                  disableRipple
                  sx={{
                    width: 50,
                    height: 30,
                    p: 0,
                    "& .MuiSwitch-switchBase": {
                      p: "3px",
                      transitionDuration: "220ms",
                    },
                    "& .MuiSwitch-thumb": {
                      width: 24,
                      height: 24,
                      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.38)" : "0 2px 10px rgba(15,26,42,0.24)",
                    },
                    "& .MuiSwitch-track": {
                      borderRadius: "999px",
                      opacity: 1,
                      backgroundColor: isDark ? alpha("#FFFFFF", 0.14) : alpha("#111111", 0.16),
                      border: `1px solid ${isDark ? alpha("#FFFFFF", 0.2) : alpha("#111111", 0.14)}`,
                      transition: "all 220ms ease",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      transform: "translateX(20px)",
                      color: "#FFF",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      background: `linear-gradient(135deg, ${accent} 0%, ${alpha(accent, 0.82)} 100%)`,
                      borderColor: alpha(accent, 0.72),
                      boxShadow: `0 0 0 3px ${alpha(accent, 0.2)}`,
                    },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    ml: 0.5,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: inStockOnly ? textPrimary : textMuted,
                  }}
                >
                   In Stock Only
                </Typography>
              }
              sx={{
                m: 0,
                "& .MuiFormControlLabel-label": { lineHeight: 1 },
              }}
            />
          </Box>
        </Box>
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
                background: isDark ? "linear-gradient(160deg, #000000 0%, #06120a 55%, #000000 100%)" : "#FFFFFF",
                border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.08)}`,
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
      ) : batches.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Typography sx={{ fontSize: "1.1rem", color: textMuted, fontWeight: 500 }}>
            No stock found
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
          {batches.map((batch) => (
            <ProductCard key={batch.batchId} batch={batch} formatPrice={formatPrice} />
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
