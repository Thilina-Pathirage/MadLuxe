"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Button,
  Box,
  Breadcrumbs,
  Chip,
  Container,
  IconButton,
  Snackbar,
  Skeleton,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import StatusChip from "@/components/madlaxue/shared/StatusChip";
import { publicApi, type PublicBatch, type PublicSettings, type PublicVariant } from "@/lib/api";
import { normalizeVariantImageUrl } from "@/utils/variantImage";
import {
  makePublicCartLineId,
  type PublicCartItem,
  upsertPublicCartItem,
} from "@/lib/publicCart";

const CURRENCY_SYMBOLS: Record<string, string> = {
  LKR: "Rs.",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
};

const FALLBACK_GRADIENT = "linear-gradient(145deg, #111111 0%, #2A9D8F 54%, #E9C46A 100%)";

const formatBatchLabel = (batch: Pick<PublicBatch, "batchId" | "createdAt">) => {
  const date = new Date(batch.createdAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  return `${dateLabel} · #${batch.batchId.slice(-6).toUpperCase()}`;
};

export default function ProductViewPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const accent = "#C9A84C";
  const textPrimary = isDark ? "#F0EDE8" : "#111111";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#333333", 0.68);

  const [variant, setVariant] = useState<PublicVariant | null>(null);
  const [batches, setBatches] = useState<PublicBatch[]>([]);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [selectedQty, setSelectedQty] = useState(1);

  const images = useMemo(
    () =>
      (variant?.images ?? [])
        .map((img) => ({
          id: img._id,
          isPrimary: img.isPrimary,
          url: normalizeVariantImageUrl(img.url),
        }))
        .filter((img): img is { id: string; isPrimary: boolean; url: string } => Boolean(img.url)),
    [variant],
  );

  const formatPrice = useCallback(
    (value: number) => {
      const symbol = CURRENCY_SYMBOLS[settings?.currencyCode ?? "LKR"] ?? "Rs.";
      return `${symbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [settings],
  );

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (images.length ? (prev - 1 + images.length) % images.length : 0));
  }, [images.length]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (images.length ? (prev + 1) % images.length : 0));
  }, [images.length]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setNotFound(false);

    Promise.allSettled([
      publicApi.getVariantById(id),
      publicApi.getSettings(),
      publicApi.getBatches({ variant: id, inStock: "true", limit: "100" }),
    ])
      .then(([variantResult, settingsResult, batchesResult]) => {
        if (cancelled) return;

        if (settingsResult.status === "fulfilled") {
          setSettings(settingsResult.value.data);
        }

        if (batchesResult.status === "fulfilled") {
          setBatches(batchesResult.value.data ?? []);
        } else {
          setBatches([]);
        }

        if (variantResult.status === "fulfilled") {
          setVariant(variantResult.value.data);
          return;
        }

        const message = variantResult.reason instanceof Error
          ? variantResult.reason.message
          : "Unable to load product";
        if (message.toLowerCase().includes("not found")) {
          setNotFound(true);
        } else {
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const selectedBatch = useMemo(() => {
    if (!batches.length) return null;
    const requestedBatch = searchParams.get("batch");
    if (requestedBatch) {
      const matched = batches.find((batch) => batch.batchId === requestedBatch || batch._id === requestedBatch);
      if (matched) return matched;
    }
    return batches[0];
  }, [batches, searchParams]);

  useEffect(() => {
    if (!images.length) {
      setActiveIndex(0);
      return;
    }
    const primaryIndex = images.findIndex((img) => img.isPrimary);
    setActiveIndex(primaryIndex >= 0 ? primaryIndex : 0);
  }, [images]);

  useEffect(() => {
    const maxQty = Math.max(selectedBatch?.qtyRemaining ?? 1, 1);
    setSelectedQty((prev) => Math.min(Math.max(prev, 1), maxQty));
  }, [selectedBatch]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Skeleton width="40%" height={24} sx={{ mb: 2 }} />
        <Skeleton width="55%" height={48} sx={{ mb: 3 }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" },
            gap: { xs: 2, md: 3 },
          }}
        >
          <Skeleton variant="rectangular" height={460} sx={{ borderRadius: "14px" }} />
          <Box>
            <Skeleton width="70%" height={30} />
            <Skeleton width="45%" height={24} sx={{ mt: 1 }} />
            <Skeleton width="35%" height={40} sx={{ mt: 2 }} />
            <Skeleton width="90%" height={120} sx={{ mt: 3 }} />
          </Box>
        </Box>
      </Container>
    );
  }

  if (notFound) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.7rem", md: "2.2rem" }, color: textPrimary }}>
          Product not found
        </Typography>
        <Typography sx={{ mt: 1.2, color: textMuted }}>
          This product may have been removed or is no longer available.
        </Typography>
        <Typography component={Link} href="/shop" sx={{ mt: 2.2, display: "inline-block", color: accent, textDecoration: "none", fontWeight: 700 }}>
          Back to Shop
        </Typography>
      </Container>
    );
  }

  if (error || !variant) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error ?? "Unable to load product."}</Alert>
        <Typography component={Link} href="/shop" sx={{ color: accent, textDecoration: "none", fontWeight: 700 }}>
          Back to Shop
        </Typography>
      </Container>
    );
  }

  const selectedBatchQty = selectedBatch?.qtyRemaining ?? 0;
  const status: "In Stock" | "Low Stock" | "Out of Stock" =
    selectedBatchQty === 0 ? "Out of Stock" : selectedBatchQty <= 5 ? "Low Stock" : "In Stock";
  const activeImage = images[activeIndex]?.url ?? null;
  const isOutOfStock = !selectedBatch || selectedBatchQty <= 0;

  const upsertCartItem = (qtyToAdd: number) => {
    if (!selectedBatch) return;

    const maxQtyAtSelection = Math.max(selectedBatch.qtyRemaining, 1);
    const lineId = makePublicCartLineId(variant._id, selectedBatch.batchId);

    const nextItem: PublicCartItem = {
      lineId,
      variantId: variant._id,
      batchId: selectedBatch.batchId,
      batchLabel: formatBatchLabel(selectedBatch),
      sku: variant.sku,
      productName: variant.productType?.name ?? "Product",
      categoryName: variant.category?.name,
      colorName: variant.color?.name,
      size: variant.size,
      unitPrice: selectedBatch.sellPrice,
      imageUrl: activeImage,
      maxQtyAtSelection,
      qty: Math.min(Math.max(qtyToAdd, 1), maxQtyAtSelection),
    };

    upsertPublicCartItem(nextItem, qtyToAdd);
  };

  const handleAddToCart = () => {
    if (!selectedBatch) {
      setSnack("No stock available for this product");
      return;
    }

    const qtyToAdd = Math.min(Math.max(selectedQty, 1), Math.max(selectedBatch.qtyRemaining, 1));
    upsertCartItem(qtyToAdd);
    setSnack(`Added ${qtyToAdd} item${qtyToAdd > 1 ? "s" : ""} from ${formatBatchLabel(selectedBatch)} to cart`);
  };

  const handleViewCart = () => {
    router.push("/shop/cart");
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Breadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: 14, color: textMuted }} />}
        sx={{ mb: 2.5 }}
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
        <Typography sx={{ fontSize: "0.78rem", color: textPrimary, fontWeight: 600 }}>
          {variant.productType?.name ?? "Product"}
        </Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.06fr 0.94fr" },
          gap: { xs: 2.5, md: 3.5 },
          alignItems: "start",
        }}
      >
        <Box>
          <Box
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                goNext();
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                goPrev();
              }
            }}
            onTouchStart={(event) => {
              setTouchStartX(event.changedTouches[0]?.clientX ?? null);
            }}
            onTouchEnd={(event) => {
              if (touchStartX == null) return;
              const endX = event.changedTouches[0]?.clientX ?? touchStartX;
              const delta = endX - touchStartX;
              if (Math.abs(delta) > 40) {
                if (delta > 0) goPrev();
                if (delta < 0) goNext();
              }
              setTouchStartX(null);
            }}
            aria-label="Product image gallery"
            sx={{
              position: "relative",
              height: { xs: 320, sm: 420, md: 500 },
              borderRadius: "14px",
              overflow: "hidden",
              outline: "none",
              border: `1px solid ${isDark ? alpha("#FFFFFF", 0.1) : alpha("#111111", 0.08)}`,
              backgroundImage: activeImage ? `url(${activeImage})` : FALLBACK_GRADIENT,
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: isDark
                ? "0 20px 38px rgba(0,0,0,0.35)"
                : "0 20px 38px rgba(15,26,42,0.12)",
            }}
          >
            {images.length > 1 && (
              <>
                <IconButton
                  aria-label="Previous image"
                  onClick={goPrev}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: 10,
                    transform: "translateY(-50%)",
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    bgcolor: alpha("#000000", 0.45),
                    backdropFilter: "blur(4px)",
                    border: `1px solid ${alpha("#FFFFFF", 0.22)}`,
                    "&:hover": { bgcolor: alpha("#000000", 0.65), borderColor: accent },
                  }}
                >
                  <ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton
                  aria-label="Next image"
                  onClick={goNext}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    right: 10,
                    transform: "translateY(-50%)",
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    bgcolor: alpha("#000000", 0.45),
                    backdropFilter: "blur(4px)",
                    border: `1px solid ${alpha("#FFFFFF", 0.22)}`,
                    "&:hover": { bgcolor: alpha("#000000", 0.65), borderColor: accent },
                  }}
                >
                  <ArrowForwardIosRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>

                <Box sx={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 0.8 }}>
                  {images.map((img, index) => (
                    <Box
                      key={img.id}
                      component="button"
                      aria-label={`View image ${index + 1}`}
                      onClick={() => setActiveIndex(index)}
                      sx={{
                        width: index === activeIndex ? 22 : 10,
                        height: 4,
                        borderRadius: "3px",
                        border: "none",
                        p: 0,
                        cursor: "pointer",
                        bgcolor: index === activeIndex ? accent : alpha("#FFFFFF", 0.52),
                        transition: "all 220ms ease",
                      }}
                    />
                  ))}
                </Box>
              </>
            )}
          </Box>

          {images.length > 1 && (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mt: 1.2,
                overflowX: "auto",
                pb: 0.4,
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": { background: alpha(accent, 0.5), borderRadius: "999px" },
              }}
            >
              {images.map((img, index) => (
                <Box
                  key={`thumb-${img.id}`}
                  component="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Open thumbnail ${index + 1}`}
                  sx={{
                    width: 72,
                    height: 72,
                    flexShrink: 0,
                    borderRadius: "10px",
                    border: `2px solid ${index === activeIndex ? accent : "transparent"}`,
                    p: 0,
                    cursor: "pointer",
                    bgcolor: "transparent",
                    backgroundImage: `url(${img.url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.08)}`,
            bgcolor: isDark ? alpha("#0d1410", 0.72) : "#FFFFFF",
            borderRadius: "14px",
            p: { xs: 2, md: 2.5 },
          }}
        >
          <Typography sx={{ fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", color: accent, fontWeight: 700 }}>
            Product View
          </Typography>

          <Typography sx={{ mt: 1, color: textPrimary, fontSize: { xs: "1.55rem", md: "2.1rem" }, fontWeight: 800, lineHeight: 1.12 }}>
            {variant.productType?.name ?? "Product"}
          </Typography>

          <Typography sx={{ mt: 0.7, color: textMuted, fontWeight: 500, fontSize: "0.9rem" }}>
            {variant.category?.name}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mt: 1.6 }}>
            <StatusChip status={status} size="small" />
            {variant.color && (
              <Chip
                size="small"
                label={variant.color.name}
                sx={{
                  height: 24,
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  bgcolor: isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.05),
                }}
                icon={
                  variant.color.hexCode ? (
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: variant.color.hexCode,
                        border: "1px solid rgba(0,0,0,0.2)",
                        ml: "6px !important",
                      }}
                    />
                  ) : undefined
                }
              />
            )}
            {variant.size && variant.size !== "N/A" && (
              <Chip
                size="small"
                label={variant.size}
                sx={{
                  height: 24,
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  bgcolor: isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.05),
                }}
              />
            )}
          </Box>

          <Typography sx={{ mt: 2.2, color: accent, fontSize: "1.55rem", fontWeight: 800 }}>
            {selectedBatch ? formatPrice(selectedBatch.sellPrice) : "--"}
          </Typography>

          <Box
            sx={{
              mt: 2,
              p: 1.4,
              borderRadius: "10px",
              border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.08)}`,
              bgcolor: isDark ? alpha("#06120a", 0.7) : alpha("#F7F6F2", 0.85),
            }}
          >
            <Typography sx={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: textMuted, mb: 1 }}>
              Stock
            </Typography>
            {batches.length === 0 ? (
              <Alert severity="warning" sx={{ py: 0.4 }}>
                No stock available for this product.
              </Alert>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                  alignItems: "center",
                  borderRadius: "8px",
                  py: 0.9,
                  px: 1.2,
                  border: `1px solid ${alpha(accent, 0.35)}`,
                }}
              >
                <Box sx={{ textAlign: "left" }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>
                    {selectedBatch ? formatBatchLabel(selectedBatch) : "--"}
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", opacity: 0.86 }}>
                    {selectedBatch ? `${selectedBatch.qtyRemaining} available` : "Out of stock"}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: textPrimary }}>
                  {selectedBatch ? formatPrice(selectedBatch.sellPrice) : "--"}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap", alignItems: "stretch" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                borderRadius: "8px",
                border: `1px solid ${isDark ? alpha("#FFFFFF", 0.16) : alpha("#111111", 0.16)}`,
                overflow: "hidden",
                minWidth: 128,
              }}
            >
              <IconButton
                aria-label="Decrease quantity"
                onClick={() => setSelectedQty((prev) => Math.max(prev - 1, 1))}
                disabled={isOutOfStock || selectedQty <= 1}
                sx={{ borderRadius: 0, width: 40, height: 40 }}
              >
                <RemoveRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Box sx={{ minWidth: 48, textAlign: "center" }}>
                <Typography sx={{ fontWeight: 700, color: textPrimary, fontSize: "0.92rem" }}>
                  {selectedQty}
                </Typography>
              </Box>
              <IconButton
                aria-label="Increase quantity"
                onClick={() =>
                  setSelectedQty((prev) => Math.min(prev + 1, Math.max(selectedBatchQty, 1)))
                }
                disabled={isOutOfStock || selectedQty >= Math.max(selectedBatchQty, 1)}
                sx={{ borderRadius: 0, width: 40, height: 40 }}
              >
                <AddRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <Button
              variant="contained"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                bgcolor: accent,
                color: isDark ? "#111111" : "#FFFFFF",
                borderRadius: "8px",
                px: 2.2,
                py: 1,
                "&:hover": { bgcolor: "#D4B060" },
                "&.Mui-disabled": {
                  bgcolor: isDark ? alpha("#FFFFFF", 0.16) : alpha("#111111", 0.12),
                  color: isDark ? alpha("#FFFFFF", 0.5) : alpha("#111111", 0.4),
                },
              }}
            >
              Add to Cart
            </Button>
            <Button
              variant="outlined"
              onClick={handleViewCart}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "8px",
                px: 2.2,
                py: 1,
                borderColor: alpha(accent, 0.65),
                color: accent,
                "&:hover": {
                  borderColor: accent,
                  bgcolor: alpha(accent, 0.08),
                },
              }}
            >
              View Cart
            </Button>
          </Box>
          {!isOutOfStock && (
            <Typography sx={{ mt: 0.7, color: textMuted, fontSize: "0.76rem" }}>
              Selected quantity: {selectedQty} (max {selectedBatchQty} in this stock)
            </Typography>
          )}

          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.08)}` }}>
            <Typography sx={{ color: textMuted, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
              SKU
            </Typography>
            <Typography sx={{ color: textPrimary, fontSize: "0.9rem", mt: 0.4, fontFamily: "monospace", fontWeight: 600 }}>
              {variant.sku}
            </Typography>

            <Typography sx={{ color: textMuted, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, mt: 1.4 }}>
              Availability
            </Typography>
            <Typography sx={{ color: textPrimary, fontSize: "0.9rem", mt: 0.4, fontWeight: 600 }}>
              {selectedBatch
                ? `${selectedBatch.qtyRemaining} in this stock`
                : "Currently out of stock"}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={2200}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnack(null)} severity="success" variant="filled" sx={{ width: "100%" }}>
          {snack}
        </Alert>
      </Snackbar>
    </Container>
  );
}
