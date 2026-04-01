"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  IconButton,
  Pagination,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import { customerApi, type CustomerOrder } from "@/lib/customerApi";
import { useCustomerAuth } from "@/lib/customerAuth";
import { normalizeVariantImageUrl } from "@/utils/variantImage";

const formatPrice = (value: number) =>
  `Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_COLORS: Record<string, "default" | "warning" | "success" | "error"> = {
  Pending: "warning",
  Completed: "success",
  Cancelled: "error",
  Deleted: "error",
};

function OrderCard({
  order,
  isDark,
  accent,
  textPrimary,
  textMuted,
  border,
  cardBg,
}: {
  order: CustomerOrder;
  isDark: boolean;
  accent: string;
  textPrimary: string;
  textMuted: string;
  border: string;
  cardBg: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: `1px solid ${border}`,
        bgcolor: cardBg,
        overflow: "hidden",
      }}
    >
      {/* Completed delivery banner */}
      {order.status === "Completed" && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: { xs: 2, md: 2.5 },
            py: 1,
            bgcolor: isDark ? alpha("#22C55E", 0.1) : alpha("#22C55E", 0.08),
            borderBottom: `1px solid ${isDark ? alpha("#22C55E", 0.2) : alpha("#22C55E", 0.25)}`,
          }}
        >
          <LocalShippingOutlinedIcon sx={{ fontSize: 15, color: "#22C55E" }} />
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#22C55E" }}>
            Order processed — will be delivered within 3–5 days
          </Typography>
        </Box>
      )}

      {/* Header row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          px: { xs: 2, md: 2.5 },
          pt: 2,
          pb: expanded ? 1.2 : 2,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: "0.95rem" }}>
            {order.orderRef}
          </Typography>
          <Typography sx={{ color: textMuted, fontSize: "0.78rem", mt: 0.2 }}>
            {new Date(order.createdAt).toLocaleDateString("en-LK", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={order.status}
            color={STATUS_COLORS[order.status] ?? "default"}
            size="small"
            sx={{ fontWeight: 700, fontSize: "0.72rem" }}
          />
          <IconButton
            size="small"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse order details" : "Expand order details"}
            sx={{
              color: textMuted,
              border: `1px solid ${border}`,
              borderRadius: "8px",
              width: 30,
              height: 30,
              transition: "transform 200ms ease",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              "&:hover": { borderColor: accent, color: accent },
            }}
          >
            <ExpandMoreRoundedIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Summary row (always visible) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          px: { xs: 2, md: 2.5 },
          pb: 2,
        }}
      >
        <Typography sx={{ color: textMuted, fontSize: "0.78rem" }}>
          {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
          {order.paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer"}
        </Typography>
        <Typography sx={{ color: accent, fontWeight: 800, fontSize: "1rem" }}>
          {formatPrice(order.total)}
        </Typography>
      </Box>

      {/* Expandable items */}
      <Collapse in={expanded} unmountOnExit>
        <Divider sx={{ borderColor: border }} />
        <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.8 }}>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: textMuted,
              mb: 1.2,
            }}
          >
            Items Ordered
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
            {order.items.map((item, idx) => {
              const imgUrl = normalizeVariantImageUrl(item.variant?.images?.[0]?.url);
              return (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    py: 0.8,
                    borderBottom: idx < order.items.length - 1 ? `1px solid ${border}` : "none",
                  }}
                >
                  {/* Product image */}
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      flexShrink: 0,
                      borderRadius: "8px",
                      border: `1px solid ${border}`,
                      overflow: "hidden",
                      bgcolor: isDark ? alpha("#FFFFFF", 0.04) : alpha("#111111", 0.04),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgUrl}
                        alt={item.variantLabel}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Typography sx={{ fontSize: "0.6rem", color: textMuted, textAlign: "center", px: 0.5 }}>
                        No image
                      </Typography>
                    )}
                  </Box>

                  {/* Label + price */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: textPrimary,
                        fontSize: "0.84rem",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.variantLabel}
                    </Typography>
                    <Typography sx={{ color: textMuted, fontSize: "0.75rem", mt: 0.2 }}>
                      {formatPrice(item.unitPrice)} × {item.qty}
                    </Typography>
                  </Box>

                  <Typography sx={{ color: textPrimary, fontWeight: 700, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                    {formatPrice(item.lineFinal)}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Totals breakdown */}
          <Box sx={{ mt: 1.5, pt: 1.2, borderTop: `1px solid ${border}` }}>
            {order.deliveryFee > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography sx={{ color: textMuted, fontSize: "0.8rem" }}>Delivery</Typography>
                <Typography sx={{ color: textMuted, fontSize: "0.8rem" }}>
                  {formatPrice(order.deliveryFee)}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ color: textPrimary, fontSize: "0.85rem", fontWeight: 700 }}>Total</Typography>
              <Typography sx={{ color: accent, fontSize: "0.95rem", fontWeight: 800 }}>
                {formatPrice(order.total)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

export default function ShopOrdersPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = "#C9A84C";
  const textPrimary = isDark ? "#F0EDE8" : "#111111";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#333333", 0.68);
  const cardBg = isDark ? alpha("#0d1410", 0.72) : "#FFFFFF";
  const border = isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.08);

  const { customer, loading: authLoading } = useCustomerAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerApi.getOrders(p, 10);
      setOrders(res.data);
      setTotalPages(res.pagination.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && customer) {
      fetchOrders(page);
    }
  }, [authLoading, customer, page, fetchOrders]);

  if (authLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress sx={{ color: accent }} />
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 8 }, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: { xs: "1.4rem", md: "1.8rem" } }}>
          Sign in to view your orders
        </Typography>
        <Typography sx={{ mt: 1, color: textMuted }}>
          Your order history is available once you&apos;re signed in.
        </Typography>
        <Button
          component={Link}
          href="/shop"
          variant="contained"
          sx={{ mt: 2.5, textTransform: "none", fontWeight: 700, bgcolor: accent, color: "#111111", "&:hover": { bgcolor: "#D4B060" } }}
        >
          Go to Shop
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: { xs: "1.6rem", md: "2.2rem" }, mb: 0.5 }}>
        My Orders
      </Typography>
      <Typography sx={{ color: textMuted, mb: 3, fontSize: "0.9rem" }}>
        {customer.name}
      </Typography>

      {loading && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress sx={{ color: accent }} />
        </Box>
      )}

      {!loading && error && (
        <Typography sx={{ color: "error.main", textAlign: "center", py: 4 }}>{error}</Typography>
      )}

      {!loading && !error && orders.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <ReceiptLongOutlinedIcon sx={{ fontSize: 56, color: textMuted, mb: 1.5 }} />
          <Typography sx={{ fontWeight: 700, color: textPrimary, fontSize: "1.2rem" }}>
            No orders yet
          </Typography>
          <Typography sx={{ color: textMuted, mt: 0.5 }}>
            Your placed orders will appear here.
          </Typography>
          <Button
            component={Link}
            href="/shop"
            variant="contained"
            sx={{ mt: 2.5, textTransform: "none", fontWeight: 700, bgcolor: accent, color: "#111111", "&:hover": { bgcolor: "#D4B060" } }}
          >
            Start Shopping
          </Button>
        </Box>
      )}

      {!loading && orders.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              isDark={isDark}
              accent={accent}
              textPrimary={textPrimary}
              textMuted={textMuted}
              border={border}
              cardBg={cardBg}
            />
          ))}
        </Box>
      )}

      {!loading && totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            sx={{
              "& .MuiPaginationItem-root": { color: textMuted },
              "& .Mui-selected": { bgcolor: `${accent} !important`, color: "#111111", fontWeight: 700 },
            }}
          />
        </Box>
      )}
    </Container>
  );
}
