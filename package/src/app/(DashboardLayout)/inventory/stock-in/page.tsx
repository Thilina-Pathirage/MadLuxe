"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Card, CardContent, Grid, Typography, MenuItem,
  TextField, Button, Alert, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Snackbar, Divider, InputAdornment, CircularProgress,
  Chip, Tooltip,
} from "@mui/material";
import { IconDownload } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import ImagePlaceholder from "@/components/madlaxue/shared/ImagePlaceholder";
import VariantImage from "@/components/madlaxue/shared/VariantImage";
import ExportSnackbar from "@/components/madlaxue/shared/ExportSnackbar";
import AppDatePicker from "@/components/madlaxue/shared/AppDatePicker";
import { useGeneralSettings } from "@/context/GeneralSettingsContext";
import { api, type StockMovement, type Variant } from "@/lib/api";
import { getCurrencyOption } from "@/lib/generalSettings";
import { getPrimaryImageUrl } from "@/utils/variantImage";
const getDisplayBatchTotal = (m: StockMovement) => Math.max(m.qty ?? 0, m.qtyRemaining ?? 0);

function mvLabel(m: any) {
  if (!m?.variant) return "Unknown";
  const { category, productType, size, color } = m.variant;
  const parts = [category?.name, productType?.name];
  if (size && size !== "N/A") parts.push(size);
  parts.push(color?.name);
  return parts.filter(Boolean).join(" / ");
}

export default function StockInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillVariantId = searchParams.get("variantId") ?? "";
  const { formatBusinessDate, formatCurrency, getBusinessToday, settings } = useGeneralSettings();
  const currencySymbol = getCurrencyOption(settings.currencyCode).symbol;
  const today = getBusinessToday();

  // Dropdown options
  const [categories, setCategories]   = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [colors, setColors]           = useState<any[]>([]);

  // Form state (store IDs for API, names for display)
  const [catId, setCatId]     = useState("");
  const [typeId, setTypeId]   = useState("");
  const [size, setSize]       = useState("");
  const [colorId, setColorId] = useState("");
  const [qty, setQty]         = useState("");
  const [costUnit, setCostUnit] = useState("");
  const [sellUnit, setSellUnit] = useState("");
  const [supplier, setSupplier] = useState("");
  const [date, setDate]       = useState(() => getBusinessToday());
  const [notes, setNotes]     = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Matched variant
  const [matchedVariant, setMatchedVariant] = useState<any | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [existingBatches, setExistingBatches] = useState<StockMovement[]>([]);

  // History
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [histTotal, setHistTotal] = useState(0);
  const [loadingHist, setLoadingHist] = useState(true);
  const [fromDate, setFromDate]   = useState("");
  const [toDate, setToDate]       = useState("");

  const [snackMsg, setSnackMsg]   = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [prefillVariant, setPrefillVariant] = useState<Variant | null>(null);
  const [prefillError, setPrefillError] = useState("");
  const [prefillApplied, setPrefillApplied] = useState(false);

  useEffect(() => {
    if (!prefillVariantId || prefillApplied || prefillVariant) return;
    setPrefillError("");
    api.getVariant(prefillVariantId)
      .then((res: any) => {
        const variant = res?.data as Variant | undefined;
        const prefillCatId = variant?.category?._id;
        const prefillTypeId = variant?.productType?._id;
        const prefillColorId = variant?.color?._id;
        if (!variant || !prefillCatId || !prefillTypeId || !prefillColorId) {
          setPrefillError("Quick Restock could not prefill this variant. Please choose fields manually.");
          setPrefillApplied(true);
          return;
        }
        setPrefillVariant(variant);
        setCatId(prefillCatId);
      })
      .catch(() => {
        setPrefillError("Quick Restock link is invalid or the variant was not found.");
        setPrefillApplied(true);
      });
  }, [prefillVariantId, prefillApplied, prefillVariant]);

  // Load static options once
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

  useEffect(() => {
    if (!prefillVariant || prefillApplied) return;

    const prefillCatId = prefillVariant.category?._id;
    const prefillTypeId = prefillVariant.productType?._id;
    const prefillColorId = prefillVariant.color?._id;
    const requestedSize = prefillVariant.size || "N/A";

    if (!prefillCatId || !prefillTypeId || !prefillColorId) {
      setPrefillError("Quick Restock data is incomplete. Please choose fields manually.");
      setPrefillApplied(true);
      setPrefillVariant(null);
      return;
    }

    if (catId !== prefillCatId) {
      setCatId(prefillCatId);
      return;
    }

    if (!productTypes.length) return;

    const selectedPrefillType = productTypes.find((t) => t._id === prefillTypeId);
    if (!selectedPrefillType) {
      setPrefillError("Quick Restock type is unavailable for this category. Please choose fields manually.");
      setPrefillApplied(true);
      setPrefillVariant(null);
      return;
    }

    const resolvedSize = selectedPrefillType.hasSizes ? requestedSize : "N/A";
    const sizeExists = !selectedPrefillType.hasSizes || (selectedPrefillType.sizes ?? []).includes(resolvedSize);
    if (!sizeExists) {
      setPrefillError("Quick Restock size is unavailable for this type. Please choose fields manually.");
      setPrefillApplied(true);
      setPrefillVariant(null);
      return;
    }

    setTypeId(prefillTypeId);
    setSize(resolvedSize);
    setColorId(prefillColorId);
    setPrefillApplied(true);
    setPrefillVariant(null);
    router.replace("/inventory/stock-in");
  }, [catId, prefillApplied, prefillVariant, productTypes, router]);

  const selectedType = productTypes.find((t) => t._id === typeId);
  const sizeOptions  = selectedType?.hasSizes ? selectedType.sizes : ["N/A"];

  // Look up variant when all 4 selections are made
  const allFilled = catId && typeId && size && colorId;

  useEffect(() => {
    if (!allFilled) { setMatchedVariant(null); return; }
    setLookingUp(true);
    api.getVariants({ category: catId, productType: typeId, size, color: colorId, limit: "1" })
      .then((res: any) => setMatchedVariant((res.data ?? [])[0] ?? null))
      .catch(() => setMatchedVariant(null))
      .finally(() => setLookingUp(false));
  }, [catId, typeId, size, colorId]);

  // Fetch existing batches when variant is matched
  useEffect(() => {
    if (!matchedVariant) { setExistingBatches([]); return; }
    api.getActiveBatches({ variant: matchedVariant._id, limit: "50" })
      .then((r) => setExistingBatches(r.data ?? []))
      .catch(() => setExistingBatches([]));
  }, [matchedVariant]);

  // Autofill sell price from matched variant
  useEffect(() => {
    if (matchedVariant?.sellPrice != null) {
      setSellUnit(String(matchedVariant.sellPrice));
      setCostUnit((prev) => prev || (matchedVariant.costPrice != null ? String(matchedVariant.costPrice) : ""));
    } else {
      setSellUnit("");
    }
  }, [matchedVariant]);

  // Fetch history
  const fetchHistory = useCallback(() => {
    setLoadingHist(true);
    const params: Record<string, string> = { type: "IN", limit: "50" };
    if (fromDate) params.dateFrom = fromDate;
    if (toDate)   params.dateTo   = toDate;
    api.getMovements(params)
      .then((res: any) => { setMovements(res.data ?? []); setHistTotal(res.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  }, [fromDate, toDate]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const totalCost = qty && costUnit ? (Number(qty) * Number(costUnit)).toFixed(2) : "—";

  const handleSubmit = async () => {
    if (!matchedVariant || !qty || !costUnit) return;
    setSubmitting(true);
    try {
      await api.stockIn({
        variantId: matchedVariant._id,
        qty: Number(qty),
        costPrice: Number(costUnit),
        sellPrice: sellUnit ? Number(sellUnit) : undefined,
        supplier: supplier || undefined,
        notes: notes || undefined,
      });
      setSnackMsg(`Added ${qty} units to ${matchedVariant.productType?.name} ${matchedVariant.color?.name}`);
      setCatId(""); setTypeId(""); setSize(""); setColorId("");
      setQty(""); setCostUnit(""); setSellUnit(""); setSupplier(""); setNotes(""); setDate(today);
      setMatchedVariant(null);
      fetchHistory();
    } catch (err: any) {
      setSnackMsg(err.message ?? "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer title="Stock In" description="Record incoming inventory">
      <PageHeader title="Stock In" subtitle="Record incoming stock" />

      {/* ── Form ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ color: "primary.dark", mb: 2.5 }}>Add Inventory</Typography>
          {!!prefillError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {prefillError}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField select label="Category" value={catId} size="small" fullWidth required
                onChange={(e) => setCatId(e.target.value)}>
                {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField select label="Type" value={typeId} size="small" fullWidth required disabled={!catId}
                onChange={(e) => { setTypeId(e.target.value); setSize(""); }}>
                {productTypes.map((t) => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField select label="Size" value={size} size="small" fullWidth required disabled={!typeId}
                onChange={(e) => setSize(e.target.value)}>
                {sizeOptions.map((s: string) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField select label="Color" value={colorId} size="small" fullWidth required
                onChange={(e) => setColorId(e.target.value)}>
                {colors.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>

          {/* Variant preview */}
          {allFilled && (
            <Box sx={{ mt: 2 }}>
              {lookingUp ? (
                <Alert severity="info">Looking up variant…</Alert>
              ) : matchedVariant ? (
                <>
                <Alert
                  severity="info"
                  icon={
                    getPrimaryImageUrl(matchedVariant)
                      ? <VariantImage
                          src={getPrimaryImageUrl(matchedVariant)}
                          alt={matchedVariant.sku}
                          width={40}
                          height={40}
                          sx={{ width: 40, height: 40, objectFit: "cover", borderRadius: "8px" }}
                        />
                      : <ImagePlaceholder width={40} height={40} />
                  }
                  sx={{ alignItems: "center", "& .MuiAlert-message": { flex: 1 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {matchedVariant.productType?.name} — {matchedVariant.color?.name}
                        {matchedVariant.size !== "N/A" ? ` (${matchedVariant.size})` : ""}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">SKU: {matchedVariant.sku}</Typography>
                    </Box>
                    <Typography variant="body2">Current stock: <strong>{matchedVariant.stockQty}</strong> units</Typography>
                    <Typography variant="caption" color="info.dark" sx={{ fontStyle: "italic" }}>
                      New stock will create a new FIFO batch at the cost you enter below.
                    </Typography>
                  </Box>
                </Alert>
                {existingBatches.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Existing Batches ({existingBatches.reduce((s, b) => s + (b.qtyRemaining ?? 0), 0)} units total)
                    </Typography>
                    <TableContainer>
                      <Table size="small" sx={{ "& td, & th": { py: 0.5, px: 1, fontSize: "0.75rem" } }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Batch Date</TableCell>
                            <TableCell align="center">Remaining</TableCell>
                            <TableCell align="right">Cost/Unit</TableCell>
                            <TableCell align="right">Sell/Unit</TableCell>
                            <TableCell>Supplier</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {existingBatches.map((b) => {
                            const remaining = b.qtyRemaining ?? 0;
                            const total = getDisplayBatchTotal(b);
                            return (
                            <TableRow key={b._id}>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {formatBusinessDate(b.createdAt)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={`${remaining} / ${total}`}
                                  size="small"
                                  color={remaining === 0 ? "default" : "success"}
                                  sx={{ fontWeight: 600, fontSize: "0.7rem", minWidth: 60 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption">
                                  {formatCurrency(b.costPrice)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {formatCurrency(b.sellPrice)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {b.supplier || "—"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
                </>
              ) : (
                <Alert severity="warning">No variant found for this combination. Add it in Products → Variants first.</Alert>
              )}
            </Box>
          )}

          <Divider sx={{ my: 2.5 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField label="Quantity to Add" type="number" value={qty} size="small" fullWidth required
                onChange={(e) => setQty(e.target.value)} slotProps={{ htmlInput: { min: 1 } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField label="Cost Price per Unit" type="number" value={costUnit} size="small" fullWidth required
                onChange={(e) => setCostUnit(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField label="Sell Price per Unit" type="number" value={sellUnit} size="small" fullWidth
                onChange={(e) => setSellUnit(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField label="Total Cost" value={totalCost === "—" ? "" : formatCurrency(Number(totalCost))}
                size="small" fullWidth disabled placeholder="Auto-calculated" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AppDatePicker label="Date" value={date} onChange={setDate} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField label="Supplier / Source" value={supplier} size="small" fullWidth
                onChange={(e) => setSupplier(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Notes" value={notes} size="small" fullWidth multiline rows={1}
                onChange={(e) => setNotes(e.target.value)} />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2.5 }}>
            <Button variant="contained" size="medium"
              disabled={!matchedVariant || !qty || !costUnit || submitting}
              onClick={handleSubmit}>
              {submitting ? "Saving…" : "Save Stock In"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ── History ── */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" sx={{ color: "primary.dark" }}>Stock In History ({histTotal})</Typography>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
              <AppDatePicker label="From" value={fromDate} onChange={setFromDate} sx={{ width: 160 }} />
              <AppDatePicker label="To"   value={toDate}   onChange={setToDate}   sx={{ width: 160 }} />
              <Button variant="outlined" size="small" startIcon={<IconDownload size={15} />}
                onClick={() => setExportOpen(true)}>Export CSV</Button>
            </Box>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Variant</TableCell>
                  <TableCell align="center">Qty Added</TableCell>
                  <TableCell align="center">Batch Remaining</TableCell>
                  <TableCell align="right">Cost/Unit</TableCell>
                  <TableCell align="right">Sell/Unit</TableCell>
                  <TableCell align="right">Total Cost</TableCell>
                  <TableCell>Source</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingHist ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress size={20} /></TableCell></TableRow>
                ) : movements.map((m) => {
                  const remaining = m.qtyRemaining ?? m.qty;
                  const total = getDisplayBatchTotal(m);
                  const pct = total > 0 ? remaining / total : 0;
                  const batchColor = pct === 0 ? "default" : pct < 0.25 ? "error" : pct < 0.75 ? "warning" : "success";
                  const batchLabel = pct === 0 ? "Depleted" : `${remaining} / ${total}`;
                  return (
                  <TableRow key={m._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{formatBusinessDate(m.createdAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{mvLabel(m)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>+{m.qty}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={pct === 0 ? "All units from this batch have been sold" : `${remaining} of ${total} units still available in this batch`}>
                        <Chip
                          label={batchLabel}
                          color={batchColor}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: "0.7rem", minWidth: 70 }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{formatCurrency(m.costPrice)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{formatCurrency(m.sellPrice)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {m.costPrice != null ? formatCurrency(m.qty * m.costPrice) : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{m.supplier || m.reason || "—"}</Typography>
                    </TableCell>
                  </TableRow>
                  );
                })}
                {!loadingHist && movements.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5, color: "text.secondary" }}>No stock-in records found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Snackbar open={!!snackMsg} autoHideDuration={3500} onClose={() => setSnackMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" onClose={() => setSnackMsg("")}>{snackMsg}</Alert>
      </Snackbar>
      <ExportSnackbar open={exportOpen} onClose={() => setExportOpen(false)} />
    </PageContainer>
  );
}
