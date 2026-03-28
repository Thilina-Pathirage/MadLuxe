"use client";

import { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Grid, Typography, TextField, MenuItem,
  Button, Alert, Divider, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, IconButton, Snackbar, InputAdornment,
  Chip, CircularProgress,
} from "@mui/material";
import { IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import ImagePlaceholder from "@/components/madlaxue/shared/ImagePlaceholder";
import VariantImage from "@/components/madlaxue/shared/VariantImage";
import { api } from "@/lib/api";
import { getPrimaryImageUrl } from "@/utils/variantImage";

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

export default function NewOrderPage() {
  const router = useRouter();

  // Customer
  const [custName, setCustName]   = useState("");
  const [custPhone, setCustPhone] = useState("");

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
    setLookingUp(true);
    api.getVariants({ category: catId, productType: typeId, size, color: colorId, limit: "1" })
      .then((r) => setMatchedVariant((r.data ?? [])[0] ?? null))
      .catch(() => setMatchedVariant(null))
      .finally(() => setLookingUp(false));
  }, [catId, typeId, size, colorId]);

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

  const canAddItem   = !!matchedVariant && addQty > 0 && matchedVariant.stockQty > 0;
  const stockWarning = matchedVariant && matchedVariant.stockQty > 0 && addQty > matchedVariant.stockQty
    ? `Only ${matchedVariant.stockQty} units in stock.`
    : "";

  const handleAddLine = () => {
    if (!matchedVariant) return;
    const label = formatVariantLabel(matchedVariant);
    const existing = lines.findIndex((l) => l.variantId === matchedVariant._id);
    if (existing >= 0) {
      setLines((prev) =>
        prev.map((l, i) =>
          i === existing
            ? { ...l, qty: l.qty + addQty, lineTotal: (l.qty + addQty) * l.unitPrice }
            : l
        )
      );
    } else {
      setLines((prev) => [...prev, {
        variantId: matchedVariant._id,
        variantLabel: label,
        imageUrl: getPrimaryImageUrl(matchedVariant) ?? undefined,
        qty: addQty,
        unitPrice: matchedVariant.sellPrice,
        lineTotal: addQty * matchedVariant.sellPrice,
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
    setSubmitting(true);
    try {
      const res: any = await api.createOrder({
        customerName: custName || undefined,
        customerPhone: custPhone || undefined,
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
      setSnackMsg(`Order ${res.data?.orderRef ?? ""} confirmed! Total: Rs.${total.toFixed(2)}`);
      // Reset all form state
      setLines([]); setCustName(""); setCustPhone("");
      setCouponInput(""); setAppliedCoupon(""); setCouponDiscount(0);
      setCouponSuccess(""); setCouponError("");
      setManualDiscount(0); setManualDiscountType("fixed");
      setPaymentMethod("BankTransfer"); setDeliveryFee(0);
      setTimeout(() => router.push("/orders/all-orders"), 1500);
    } catch (err: any) {
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
              <Typography variant="h6" sx={{ color: "primary.dark", mb: 2 }}>Customer (Optional)</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Customer Name" value={custName} size="small" fullWidth
                    onChange={(e) => setCustName(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Phone" value={custPhone} size="small" fullWidth
                    onChange={(e) => setCustPhone(e.target.value)} />
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
                <Grid size={{ xs: 12, sm: 2 }}>
                  <TextField label="Qty" type="number" value={addQty} size="small" fullWidth
                    onChange={(e) => setAddQty(Math.max(1, Number(e.target.value)))}
                    sx={{ minWidth: 120 }}
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
              {matchedVariant && matchedVariant.stockQty === 0 && (
                <Alert severity="error" sx={{ mt: 1.5 }}>This variant is out of stock.</Alert>
              )}
              {stockWarning && (
                <Alert severity="warning" sx={{ mt: 1.5 }}>{stockWarning}</Alert>
              )}
              {matchedVariant && matchedVariant.stockQty > 0 && !stockWarning && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatVariantLabel(matchedVariant)} — {matchedVariant.stockQty} in stock — Rs.{matchedVariant.sellPrice.toFixed(2)} each
                  </Typography>
                </Box>
              )}

              {/* Add button moved to bottom */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button variant="contained" size="medium"
                  disabled={!canAddItem || !!stockWarning || lookingUp}
                  onClick={handleAddLine} sx={{ minWidth: 120, height: 40 }}>
                  {lookingUp ? <CircularProgress size={16} color="inherit" /> : "Add"}
                </Button>
              </Box>
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
        <Alert severity="success" variant="filled" onClose={() => setSnackMsg("")}>{snackMsg}</Alert>
      </Snackbar>
    </PageContainer>
  );
}
