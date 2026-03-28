"use client";

import { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Grid, Typography, TextField, MenuItem,
  Button, Alert, AlertColor, Divider, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, IconButton, Snackbar, InputAdornment,
  Chip, CircularProgress,
} from "@mui/material";
import { IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import ImagePlaceholder from "@/components/madlaxue/shared/ImagePlaceholder";
import VariantImage from "@/components/madlaxue/shared/VariantImage";
import OrderBillDialog from "@/components/madlaxue/shared/OrderBillDialog";
import { api, Order, StockMovement } from "@/lib/api";
import { getPrimaryImageUrl } from "@/utils/variantImage";
import dayjs from "dayjs";

// FIFO price calculation — mirrors backend allocation logic
function calcFifoPrice(batches: StockMovement[], qty: number) {
  let remaining = qty;
  let totalPrice = 0;
  const allocations: { date: string; qty: number; sellPrice: number }[] = [];

  for (const b of batches) {
    if (remaining <= 0) break;
    const sell = b.sellPrice ?? 0;
    const take = Math.min(remaining, b.qtyRemaining ?? 0);
    if (take <= 0) continue;
    totalPrice += take * sell;
    allocations.push({ date: b.createdAt, qty: take, sellPrice: sell });
    remaining -= take;
  }

  const totalAllocated = qty - remaining;
  const avgUnitPrice = totalAllocated > 0 ? Math.round((totalPrice / totalAllocated) * 100) / 100 : 0;
  return { totalPrice: Math.round(totalPrice * 100) / 100, avgUnitPrice, allocations, fulfilled: remaining <= 0 };
}

function reserveFifoBatches(batches: StockMovement[], reservedQty: number) {
  let remainingToReserve = reservedQty;

  return batches.map((batch) => {
    const available = batch.qtyRemaining ?? 0;
    const reservedFromBatch = Math.min(remainingToReserve, available);
    remainingToReserve -= reservedFromBatch;

    return {
      ...batch,
      qtyRemaining: available - reservedFromBatch,
    };
  });
}

function sortFifoBatches(batches: StockMovement[]) {
  return [...batches].sort((left, right) => {
    const timeDiff = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return left._id.localeCompare(right._id);
  });
}

interface LineItem {
  variantId: string;
  variantLabel: string;
  imageUrl?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  discount: number;
  discountType: "fixed" | "percent";
}

function formatVariantLabel(v: any) {
  const parts = [v.category?.name, v.productType?.name];
  if (v.size && v.size !== "N/A") parts.push(v.size);
  parts.push(v.color?.name);
  return parts.filter(Boolean).join(" / ");
}

const PHONE_MAX_DIGITS = 9;

export default function NewOrderPage() {
  const router = useRouter();

  // Customer
  const [custName, setCustName]   = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Dropdown data
  const [categories, setCategories]   = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [colors, setColors]           = useState<any[]>([]);

  // Add-item selectors
  const [catId, setCatId]     = useState("");
  const [typeId, setTypeId]   = useState("");
  const [size, setSize]       = useState("");
  const [colorId, setColorId] = useState("");
  const [addQty, setAddQty]   = useState(1);
  const [addDiscount, setAddDiscount]     = useState(0);
  const [addDiscountType, setAddDiscountType] = useState<"fixed" | "percent">("fixed");

  // Variant lookup
  const [matchedVariant, setMatchedVariant] = useState<any | null>(null);
  const [lookingUp, setLookingUp]           = useState(false);
  const [variantBatches, setVariantBatches] = useState<StockMovement[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Order lines
  const [lines, setLines] = useState<LineItem[]>([]);

  // Coupon
  const [couponInput, setCouponInput]       = useState("");
  const [appliedCoupon, setAppliedCoupon]   = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError]       = useState("");
  const [couponSuccess, setCouponSuccess]   = useState("");
  const [couponValidating, setCouponValidating] = useState(false);

  // Manual discount
  const [manualDiscount, setManualDiscount]         = useState(0);
  const [manualDiscountType, setManualDiscountType] = useState<"fixed" | "percent">("fixed");

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BankTransfer">("BankTransfer");
  const [deliveryFee, setDeliveryFee]     = useState(300);

  const [submitting, setSubmitting] = useState(false);
  const [snackMsg, setSnackMsg]     = useState("");
  const [snackSeverity, setSnackSeverity] = useState<AlertColor>("success");
  const [billOrder, setBillOrder]   = useState<Order | null>(null);

  // Load categories + colors on mount
  useEffect(() => {
    api.getCategories().then((r: any) => setCategories(r.data ?? []));
    api.getColors().then((r: any) => setColors(r.data ?? []));
  }, []);

  // Load product types when category changes
  useEffect(() => {
    if (!catId) { setProductTypes([]); setTypeId(""); setSize(""); return; }
    api.getProductTypes(catId).then((r: any) => setProductTypes(r.data ?? []));
    setTypeId(""); setSize("");
  }, [catId]);

  // Variant lookup when all 4 selectors are filled
  useEffect(() => {
    if (!catId || !typeId || !size || !colorId) { setMatchedVariant(null); return; }
    setMatchedVariant(null);
    setLookingUp(true);
    api.getVariants({ category: catId, productType: typeId, size, color: colorId, limit: "1" })
      .then((r) => setMatchedVariant((r.data ?? [])[0] ?? null))
      .catch(() => setMatchedVariant(null))
      .finally(() => setLookingUp(false));
  }, [catId, typeId, size, colorId]);

  // Fetch active batches when variant is matched
  useEffect(() => {
    if (!matchedVariant) { setVariantBatches([]); setLoadingBatches(false); return; }
    setLoadingBatches(true);
    api.getActiveBatches({ variant: matchedVariant._id, limit: "50" })
      .then((r) => setVariantBatches(r.data ?? []))
      .catch(() => setVariantBatches([]))
      .finally(() => setLoadingBatches(false));
  }, [matchedVariant]);

  const selectedType = productTypes.find((t) => t._id === typeId);
  const sizeOptions  = selectedType?.hasSizes ? selectedType.sizes : ["N/A"];

  // Calculations
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  const itemDiscountAmount = lines.reduce((total, l) => {
    const d = l.discountType === "percent"
      ? Math.round((l.lineTotal * l.discount) / 100 * 100) / 100
      : l.discount;
    return total + d;
  }, 0);

  const subtotalAfterItemDiscount = subtotal - itemDiscountAmount;

  const manualDiscountAmount = manualDiscountType === "percent"
    ? Math.round((subtotalAfterItemDiscount * manualDiscount) / 100 * 100) / 100
    : manualDiscount;

  const total = Math.max(0, subtotalAfterItemDiscount - couponDiscount - manualDiscountAmount);

  // Use batch-level total instead of variant-level stockQty, adjusted for draft reservations
  const reservedQtyForMatchedVariant = matchedVariant
    ? lines.find((line) => line.variantId === matchedVariant._id)?.qty ?? 0
    : 0;
  const fifoBatches = sortFifoBatches(variantBatches);
  const previewBatches = reserveFifoBatches(fifoBatches, reservedQtyForMatchedVariant);
  const batchTotalQty = previewBatches.reduce((s, b) => s + (b.qtyRemaining ?? 0), 0);
  const matchedStockQty = matchedVariant ? batchTotalQty : null;
  const fifoResult = matchedVariant && previewBatches.length > 0
    ? calcFifoPrice(previewBatches, addQty)
    : null;
  const canAddItem = !!matchedVariant && !loadingBatches && matchedStockQty !== null && addQty > 0 && matchedStockQty > 0;
  const stockWarning = matchedStockQty !== null && matchedStockQty > 0 && addQty > matchedStockQty
    ? `Only ${matchedStockQty} units in stock.`
    : "";
  const hasCompleteVariantSelection = !!catId && !!typeId && !!size && !!colorId;
  const isOutOfStockSelection =
    hasCompleteVariantSelection &&
    !lookingUp &&
    !loadingBatches &&
    !!matchedVariant &&
    matchedStockQty !== null &&
    matchedStockQty <= 0;
  const isUnavailableSelection = hasCompleteVariantSelection && !lookingUp && !matchedVariant;
  const addDisabledReason =
    isOutOfStockSelection || isUnavailableSelection
      ? "Out of stock - cannot add this item."
      : "";

  const handleAddLine = () => {
    if (!matchedVariant) return;

    if (!fifoResult?.fulfilled) {
      setSnackSeverity("error");
      setSnackMsg("Not enough stock available for this item.");
      return;
    }

    const label = formatVariantLabel(matchedVariant);
    const unitPrice = fifoResult?.avgUnitPrice ?? matchedVariant.sellPrice;
    const existing = lines.findIndex((l) => l.variantId === matchedVariant._id);
    if (existing >= 0) {
      // Recalculate FIFO price for combined qty
      const newQty = lines[existing].qty + addQty;
      const combined = calcFifoPrice(fifoBatches, newQty);
      if (!combined.fulfilled) {
        setSnackSeverity("error");
        setSnackMsg("Not enough stock available for this item.");
        return;
      }
      const newUnitPrice = combined.avgUnitPrice || lines[existing].unitPrice;
      setLines((prev) =>
        prev.map((l, i) =>
          i === existing
            ? { ...l, qty: newQty, unitPrice: newUnitPrice, lineTotal: newQty * newUnitPrice }
            : l
        )
      );
    } else {
      setLines((prev) => [...prev, {
        variantId: matchedVariant._id,
        variantLabel: label,
        imageUrl: getPrimaryImageUrl(matchedVariant) ?? undefined,
        qty: addQty,
        unitPrice,
        lineTotal: addQty * unitPrice,
        discount: addDiscount,
        discountType: addDiscountType,
      }]);
    }
    setCatId(""); setTypeId(""); setSize(""); setColorId("");
    setAddQty(1); setAddDiscount(0); setAddDiscountType("fixed");
    // Clear coupon when items change
    if (appliedCoupon) { setAppliedCoupon(""); setCouponDiscount(0); setCouponSuccess(""); }
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
    if (appliedCoupon) { setAppliedCoupon(""); setCouponDiscount(0); setCouponSuccess(""); }
  };

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length > PHONE_MAX_DIGITS) {
      setCustPhone(digitsOnly.slice(0, PHONE_MAX_DIGITS));
      setPhoneError(`Phone number can have at most ${PHONE_MAX_DIGITS} digits.`);
      return;
    }
    setCustPhone(digitsOnly);
    if (value && /\D/.test(value)) {
      setPhoneError("Only numeric characters allowed.");
      return;
    }
    setPhoneError("");
  };

  const ensurePhoneIsValid = () => {
    if (!custPhone) {
      setPhoneError("Phone number is required.");
      return false;
    }
    if (phoneError) return false;
    if (custPhone.length !== PHONE_MAX_DIGITS) {
      setPhoneError(`Phone number must have ${PHONE_MAX_DIGITS} digits.`);
      return false;
    }
    return true;
  };

  const handleApplyCoupon = async () => {
    setCouponValidating(true);
    try {
      const res = await api.validateCoupon(couponInput, subtotalAfterItemDiscount);
      if (!res.valid) {
        setCouponError(res.reason ?? "Invalid coupon."); setCouponSuccess("");
        setCouponDiscount(0); setAppliedCoupon("");
      } else {
        const amount = res.discountAmount ?? 0;
        setCouponDiscount(amount);
        setCouponSuccess(`Discount of Rs.${amount.toFixed(2)} applied!`);
        setCouponError(""); setAppliedCoupon(couponInput.toUpperCase());
      }
    } catch (err: any) {
      setCouponError(err.message ?? "Failed to validate coupon.");
    } finally {
      setCouponValidating(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (lines.length === 0) return;
    if (!ensurePhoneIsValid()) {
      setSnackSeverity("error");
      setSnackMsg("Please fix the phone number before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const res: any = await api.createOrder({
        customerName: custName || undefined,
        customerPhone: custPhone ? `+94${custPhone}` : undefined,
        items: lines.map((l) => ({
          variantId: l.variantId,
          qty: l.qty,
          discountType: l.discountType,
          discount: l.discount,
        })),
        couponCode: appliedCoupon || undefined,
        manualDiscount: manualDiscount || undefined,
        manualDiscountType: manualDiscountType,
        paymentMethod,
        deliveryFee,
      });
      // Capture order data before resetting form
      setBillOrder(res.data ?? null);
      setSnackSeverity("success");
      setSnackMsg(`Order ${res.data?.orderRef ?? ""} confirmed! Total: Rs.${total.toFixed(2)}`);
      // Reset all form state
      setLines([]); setCustName(""); setCustPhone(""); setPhoneError("");
      setCouponInput(""); setAppliedCoupon(""); setCouponDiscount(0);
      setCouponSuccess(""); setCouponError("");
      setManualDiscount(0); setManualDiscountType("fixed");
      setPaymentMethod("BankTransfer"); setDeliveryFee(0);
    } catch (err: any) {
      setSnackSeverity("error");
      setSnackMsg(err.message ?? "Failed to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer title="New Order" description="Create a new order">
      <PageHeader title="New Order" />

      <Grid container spacing={3}>
        {/* Left column: form */}
        <Grid size={{ xs: 12, lg: 8 }}>

          {/* Customer */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "primary.dark", mb: 2 }}>Customer</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Customer Name" value={custName} size="small" fullWidth
                    onChange={(e) => setCustName(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Phone"
                    value={custPhone}
                    size="small"
                    fullWidth
                    error={!!phoneError}
                    helperText={phoneError || `Required ${PHONE_MAX_DIGITS}-digit local number; +94 prefix added.`}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">+94</InputAdornment>,
                      inputProps: { maxLength: PHONE_MAX_DIGITS },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Payment & Delivery */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "primary.dark", mb: 2 }}>Payment & Delivery</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField select label="Payment Method" value={paymentMethod} size="small" fullWidth
                    onChange={(e) => setPaymentMethod(e.target.value as "COD" | "BankTransfer")}>
                    <MenuItem value="BankTransfer">Bank Transfer</MenuItem>
                    <MenuItem value="COD">COD (Cash on Delivery)</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField select label="Delivery Method" value={deliveryFee > 0 ? "Delivery" : "StorePickup"} size="small" fullWidth
                    onChange={(e) => setDeliveryFee(e.target.value === "Delivery" ? 300 : 0)}>
                    <MenuItem value="Delivery">Delivery</MenuItem>
                    <MenuItem value="StorePickup">Store Pickup</MenuItem>
                  </TextField>
                </Grid>
                {deliveryFee > 0 && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField type="number" label="Delivery Fee" value={deliveryFee} size="small" fullWidth
                      onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value)))}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }, htmlInput: { min: 0, step: 0.01 } }} />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Add items */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "primary.dark", mb: 2 }}>Add Items</Typography>
              <Grid container spacing={1.5} alignItems="flex-start">
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField select label="Category" value={catId} size="small" fullWidth
                    onChange={(e) => setCatId(e.target.value)}>
                    {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField select label="Type" value={typeId} size="small" fullWidth disabled={!catId}
                    onChange={(e) => { setTypeId(e.target.value); setSize(""); }}>
                    {productTypes.map((t) => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField select label="Size" value={size} size="small" fullWidth disabled={!typeId}
                    onChange={(e) => setSize(e.target.value)}>
                    {sizeOptions.map((s: string) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField select label="Color" value={colorId} size="small" fullWidth
                    onChange={(e) => setColorId(e.target.value)}>
                    {colors.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField label="Qty" type="number" value={addQty} size="small" fullWidth
                    onChange={(e) => setAddQty(Math.max(1, Number(e.target.value)))}
                    slotProps={{ htmlInput: { min: 1 } }} />
                </Grid>

                {/* Per-item discount */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    type="number" label="Item Discount" placeholder="0"
                    value={addDiscount}
                    onChange={(e) => setAddDiscount(Math.max(0, Number(e.target.value)))}
                    size="small" fullWidth
                    slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField select label="Discount Type" value={addDiscountType}
                    onChange={(e) => setAddDiscountType(e.target.value as "fixed" | "percent")}
                    size="small" fullWidth>
                    <MenuItem value="fixed">Rs. (Fixed)</MenuItem>
                    <MenuItem value="percent">% (Percent)</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              {stockWarning && (
                <Alert severity="warning" sx={{ mt: 1.5 }}>{stockWarning}</Alert>
              )}
              {matchedVariant && previewBatches.length > 0 && !stockWarning && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {formatVariantLabel(matchedVariant)} — {batchTotalQty} in stock
                  </Typography>
                  <TableContainer sx={{ mb: 1 }}>
                    <Table size="small" sx={{ "& td, & th": { py: 0.5, px: 1, fontSize: "0.75rem" } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Batch</TableCell>
                          <TableCell align="center">Available</TableCell>
                          <TableCell align="right">Sell Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewBatches.map((b) => (
                          <TableRow key={b._id}>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {dayjs(b.createdAt).format("DD MMM YYYY")}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="caption">{b.qtyRemaining ?? 0}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                Rs.{(b.sellPrice ?? 0).toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {fifoResult && addQty > 0 && fifoResult.fulfilled && (
                    <Typography variant="caption" color="text.secondary">
                      For {addQty} unit{addQty > 1 ? "s" : ""}:{" "}
                      {fifoResult.allocations.map((a, i) => (
                        <span key={i}>
                          {i > 0 ? " + " : ""}{a.qty} × Rs.{a.sellPrice.toFixed(2)}
                        </span>
                      ))}
                      {" "}= <strong>Rs.{fifoResult.totalPrice.toFixed(2)}</strong>
                      {fifoResult.allocations.length > 1 && (
                        <> (avg Rs.{fifoResult.avgUnitPrice.toFixed(2)}/unit)</>
                      )}
                    </Typography>
                  )}
                </Box>
              )}
              {matchedVariant && !lookingUp && loadingBatches && (
                <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={14} />
                  <Typography variant="caption" color="text.secondary">Loading stock batches…</Typography>
                </Box>
              )}
              {matchedVariant && !loadingBatches && matchedStockQty === 0 && variantBatches.length === 0 && !lookingUp && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="error">
                    {formatVariantLabel(matchedVariant)} — No stock available
                  </Typography>
                </Box>
              )}

              {/* Third row aligned to the same 12-column grid */}
              <Grid container spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 12, sm: 10 }}>
                  {addDisabledReason && (
                    <Alert severity="error" sx={{ mb: 0, py: 0 }}>
                      {addDisabledReason}
                    </Alert>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <Button variant="contained" size="medium" fullWidth
                    disabled={!canAddItem || !!stockWarning || lookingUp}
                    onClick={handleAddLine} sx={{ height: 40 }}>
                    {lookingUp ? <CircularProgress size={16} color="inherit" /> : "Add"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Order lines */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "primary.dark", mb: 2 }}>Order Items</Typography>

              {lines.length === 0 ? (
                <Box sx={{
                  border: "2px dashed", borderColor: "grey.300", borderRadius: "10px",
                  py: 5, textAlign: "center", color: "text.secondary",
                }}>
                  <Typography variant="body2">Add items above to begin your order.</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 48 }}>Image</TableCell>
                        <TableCell>Variant</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Discount</TableCell>
                        <TableCell align="right">Line Total</TableCell>
                        <TableCell sx={{ width: 40 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lines.map((l, idx) => {
                        const itemDiscount = l.discountType === "percent"
                          ? Math.round((l.lineTotal * l.discount) / 100 * 100) / 100
                          : l.discount;
                        const discountedTotal = l.lineTotal - itemDiscount;
                        return (
                          <TableRow key={idx} sx={{ "&:last-child td": { border: 0 } }}>
                            <TableCell>
                              {l.imageUrl ? (
                                <VariantImage
                                  src={l.imageUrl}
                                  alt={l.variantLabel}
                                  width={32}
                                  height={32}
                                  sx={{ width: 32, height: 32, objectFit: "cover", borderRadius: "8px" }}
                                />
                              ) : (
                                <ImagePlaceholder width={32} height={32} />
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{l.variantLabel}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">{l.qty}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">Rs.{l.unitPrice.toFixed(2)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ color: "success.main" }}>
                                {itemDiscount > 0 ? `−Rs.${itemDiscount.toFixed(2)}` : "—"}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>Rs.{discountedTotal.toFixed(2)}</Typography>
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => removeLine(idx)} sx={{ color: "error.main" }}>
                                <IconX size={14} stroke={2} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: coupon + summary */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Coupon */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "primary.dark", mb: 2 }}>Coupon Code</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  placeholder="e.g. SUMMER10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  size="small" fullWidth disabled={lines.length === 0}
                />
                <Button variant="outlined" size="small" sx={{ flexShrink: 0 }}
                  disabled={!couponInput || lines.length === 0 || couponValidating}
                  onClick={handleApplyCoupon}>
                  {couponValidating ? <CircularProgress size={14} /> : "Apply"}
                </Button>
              </Box>
              {couponSuccess && <Alert severity="success" sx={{ mt: 1.5 }}>{couponSuccess}</Alert>}
              {couponError   && <Alert severity="error"   sx={{ mt: 1.5 }}>{couponError}</Alert>}
            </CardContent>
          </Card>

          {/* Manual Discount */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "primary.dark", mb: 2 }}>Manual Discount</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  type="number" label="Discount" placeholder="0"
                  value={manualDiscount}
                  onChange={(e) => setManualDiscount(Math.max(0, Number(e.target.value)))}
                  size="small" fullWidth
                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                />
                <TextField select value={manualDiscountType}
                  onChange={(e) => setManualDiscountType(e.target.value as "fixed" | "percent")}
                  size="small" sx={{ width: 120, flexShrink: 0 }}>
                  <MenuItem value="fixed">Rs. (Fixed)</MenuItem>
                  <MenuItem value="percent">% (Percent)</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ mt: 1.5, display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  {manualDiscountType === "percent" ? `${manualDiscount}%` : `Rs.${manualDiscount.toFixed(2)}`} discount
                </Typography>
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                  {manualDiscountAmount > 0 ? `−Rs.${manualDiscountAmount.toFixed(2)}` : "No discount"}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "primary.dark", mb: 2 }}>Summary</Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                  <Typography variant="body2">Rs.{subtotal.toFixed(2)}</Typography>
                </Box>
                {itemDiscountAmount > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Item Discounts</Typography>
                    <Typography variant="body2" sx={{ color: "success.main" }}>−Rs.{itemDiscountAmount.toFixed(2)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Coupon
                    </Typography>
                    {appliedCoupon && <Chip label={appliedCoupon} size="small" color="success" sx={{ ml: 0.5, height: 18, fontSize: "0.65rem" }} />}
                  </Box>
                  <Typography variant="body2" sx={{ color: couponDiscount > 0 ? "success.main" : "text.secondary" }}>
                    {couponDiscount > 0 ? `−Rs.${couponDiscount.toFixed(2)}` : "—"}
                  </Typography>
                </Box>
                {manualDiscountAmount > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Manual Discount</Typography>
                    <Typography variant="body2" sx={{ color: "success.main" }}>−Rs.{manualDiscountAmount.toFixed(2)}</Typography>
                  </Box>
                )}

                <Divider />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.dark" }}>Total</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.dark", letterSpacing: "-0.02em" }}>
                    Rs.{total.toFixed(2)}
                  </Typography>
                </Box>

                {deliveryFee > 0 && (
                  <>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Delivery Fee</Typography>
                      <Typography variant="body2">Rs.{deliveryFee.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Customer Pays</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "warning.dark" }}>
                        Rs.{(total + deliveryFee).toFixed(2)}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>

              <Button
                variant="contained" fullWidth size="large" sx={{ mt: 3 }}
                disabled={lines.length === 0 || submitting}
                onClick={handleConfirmOrder}
              >
                {submitting ? "Confirming…" : "Confirm Order"}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={!!snackMsg} autoHideDuration={4000} onClose={() => setSnackMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackSeverity} variant="filled" onClose={() => setSnackMsg("")}>{snackMsg}</Alert>
      </Snackbar>

      {billOrder && (
        <OrderBillDialog
          open={!!billOrder}
          order={billOrder}
          onClose={() => { setBillOrder(null); router.push("/orders/all-orders"); }}
        />
      )}
    </PageContainer>
  );
}
