"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Card, CardContent, Grid, Typography, TextField, MenuItem,
  Button, Alert, RadioGroup, FormControlLabel, Radio, FormLabel,
  FormControl, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, Snackbar, CircularProgress,
} from "@mui/material";
import dayjs from "dayjs";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import { api } from "@/lib/api";

const REASONS = ["Damaged", "Lost", "Found", "Returned", "Recount", "Other"];

function mvLabel(m: any) {
  if (!m?.variant) return "Unknown";
  const { category, productType, size, color } = m.variant;
  const parts = [category?.name, productType?.name];
  if (size && size !== "N/A") parts.push(size);
  parts.push(color?.name);
  return parts.filter(Boolean).join(" / ");
}

export default function AdjustmentsPage() {
  const [categories, setCategories]   = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [colors, setColors]           = useState<any[]>([]);

  const [catId, setCatId]     = useState("");
  const [typeId, setTypeId]   = useState("");
  const [size, setSize]       = useState("");
  const [colorId, setColorId] = useState("");
  const [adjType, setAdjType] = useState<"add" | "reduce">("add");
  const [qty, setQty]         = useState("");
  const [reason, setReason]   = useState("");
  const [notes, setNotes]     = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [matchedVariant, setMatchedVariant] = useState<any | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const [snackMsg, setSnackMsg]       = useState("");

  useEffect(() => {
    api.getCategories().then((r: any) => setCategories(r.data ?? []));
    api.getColors().then((r: any) => setColors(r.data ?? []));
  }, []);

  useEffect(() => {
    if (!catId) { setProductTypes([]); setTypeId(""); setSize(""); return; }
    api.getProductTypes(catId).then((r: any) => setProductTypes(r.data ?? []));
    setTypeId(""); setSize("");
  }, [catId]);

  const selectedType = productTypes.find((t) => t._id === typeId);
  const sizeOptions  = selectedType?.hasSizes ? selectedType.sizes : ["N/A"];
  const allFilled    = catId && typeId && size && colorId;

  useEffect(() => {
    if (!allFilled) { setMatchedVariant(null); return; }
    setLookingUp(true);
    api.getVariants({ category: catId, productType: typeId, size, color: colorId, limit: "1" })
      .then((res: any) => setMatchedVariant((res.data ?? [])[0] ?? null))
      .catch(() => setMatchedVariant(null))
      .finally(() => setLookingUp(false));
  }, [catId, typeId, size, colorId]);

  const fetchHistory = useCallback(() => {
    setLoadingHist(true);
    api.getMovements({ type: "ADJUST", limit: "50" })
      .then((res: any) => setAdjustments(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const qtyNum = Number(qty) || 0;
  const willGoNegative = adjType === "reduce" && matchedVariant && qtyNum > matchedVariant.stockQty;
  const canSubmit = !!matchedVariant && qtyNum > 0 && !!reason && !willGoNegative;

  const handleSubmit = async () => {
    if (!matchedVariant || !canSubmit) return;
    setSubmitting(true);
    try {
      await api.adjust({
        variantId: matchedVariant._id,
        adjustDirection: adjType,
        qty: qtyNum,
        reason,
        notes: notes || undefined,
      });
      setSnackMsg(`Adjustment saved: ${adjType === "add" ? "+" : "-"}${qtyNum} units for ${matchedVariant.productType?.name} ${matchedVariant.color?.name}`);
      setCatId(""); setTypeId(""); setSize(""); setColorId("");
      setQty(""); setReason(""); setNotes(""); setAdjType("add");
      setMatchedVariant(null);
      fetchHistory();
    } catch (err: any) {
      setSnackMsg(err.message ?? "Failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer title="Adjustments" description="Manual stock adjustments">
      <PageHeader title="Stock Adjustments" subtitle="Manually correct stock levels" />

      <Grid container spacing={3}>
        {/* ── Form ── */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "primary.dark", mb: 2.5 }}>New Adjustment</Typography>

              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField select label="Category" value={catId} size="small" fullWidth required
                    onChange={(e) => setCatId(e.target.value)}>
                    {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={12}>
                  <TextField select label="Type" value={typeId} size="small" fullWidth required disabled={!catId}
                    onChange={(e) => { setTypeId(e.target.value); setSize(""); }}>
                    {productTypes.map((t) => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={12}>
                  <TextField select label="Size" value={size} size="small" fullWidth required disabled={!typeId}
                    onChange={(e) => setSize(e.target.value)}>
                    {sizeOptions.map((s: string) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={12}>
                  <TextField select label="Color" value={colorId} size="small" fullWidth required
                    onChange={(e) => setColorId(e.target.value)}>
                    {colors.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>

              {allFilled && (
                lookingUp ? (
                  <Alert severity="info" sx={{ mt: 2 }}>Looking up variant…</Alert>
                ) : matchedVariant ? (
                  <Alert severity="info" sx={{ mt: 2, mb: 0 }}>
                    Current stock: <strong>{matchedVariant.stockQty}</strong> units
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mt: 2, mb: 0 }}>Variant not found.</Alert>
                )
              )}

              <Box sx={{ mt: 2.5 }}>
                <FormControl>
                  <FormLabel sx={{ fontSize: "0.8rem", fontWeight: 600, mb: 0.5 }}>Adjustment Type</FormLabel>
                  <RadioGroup row value={adjType} onChange={(e) => setAdjType(e.target.value as "add" | "reduce")}>
                    <FormControlLabel value="add"    control={<Radio size="small" />} label="Add Stock" />
                    <FormControlLabel value="reduce" control={<Radio size="small" />} label="Reduce Stock" />
                  </RadioGroup>
                </FormControl>
              </Box>

              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={12}>
                  <TextField label="Quantity" type="number" value={qty} size="small" fullWidth required
                    onChange={(e) => setQty(e.target.value)} slotProps={{ htmlInput: { min: 1 } }}
                    error={!!willGoNegative} />
                  {willGoNegative && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      Cannot reduce by more than current stock ({matchedVariant?.stockQty} units).
                    </Alert>
                  )}
                </Grid>
                <Grid size={12}>
                  <TextField select label="Reason" value={reason} size="small" fullWidth required
                    onChange={(e) => setReason(e.target.value)}>
                    {REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={12}>
                  <TextField label="Notes" value={notes} size="small" fullWidth multiline rows={3}
                    onChange={(e) => setNotes(e.target.value)} />
                </Grid>
              </Grid>

              <Button variant="contained" fullWidth sx={{ mt: 2.5 }}
                disabled={!canSubmit || submitting} onClick={handleSubmit}>
                {submitting ? "Saving…" : "Save Adjustment"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* ── History ── */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "primary.dark", mb: 2 }}>Adjustment History</Typography>
              {loadingHist ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Variant</TableCell>
                        <TableCell align="center">Type</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {adjustments.map((m) => {
                        const isAdd = m.adjustDirection === "add";
                        return (
                          <TableRow key={m._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {dayjs(m.createdAt).format("DD MMM YYYY")}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {mvLabel(m)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={isAdd ? "Add" : "Reduce"} color={isAdd ? "success" : "error"} size="small" />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontWeight: 700, color: isAdd ? "success.main" : "error.main" }}>
                                {isAdd ? `+${m.qty}` : `−${m.qty}`}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{m.reason}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">{m.createdBy ?? "Admin"}</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {adjustments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                            No adjustments recorded yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={!!snackMsg} autoHideDuration={3500} onClose={() => setSnackMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" onClose={() => setSnackMsg("")}>{snackMsg}</Alert>
      </Snackbar>
    </PageContainer>
  );
}
