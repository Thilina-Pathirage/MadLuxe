"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, IconButton, TextField,
  Select, MenuItem, InputAdornment, ToggleButtonGroup, ToggleButton,
  Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Pagination, Tooltip, CircularProgress, Chip,
} from "@mui/material";
import {
  IconSearch, IconPlus, IconMinus, IconList, IconLayoutGrid, IconHistory,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageContainer from "@/app/portal/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import ImagePlaceholder from "@/components/madlaxue/shared/ImagePlaceholder";
import VariantImage from "@/components/madlaxue/shared/VariantImage";
import { useGeneralSettings } from "@/context/GeneralSettingsContext";
import { api, StockMovement } from "@/lib/api";
import { getPrimaryImageUrl } from "@/utils/variantImage";

const PER_PAGE = 25;

const REASONS = ["Damaged", "Lost", "Found", "Returned", "Recount", "Other"];
const getDisplayBatchTotal = (m: StockMovement) => Math.max(m.qty ?? 0, m.qtyRemaining ?? 0);

// ─── Quick Action Dialog (batch-level) ────────────────────────────────────
function QuickActionDialog({ batch, mode, onClose, onSubmit }: {
  batch: StockMovement; mode: "add" | "reduce"; onClose: () => void;
  onSubmit: (variantId: string, movementId: string, qty: number, reason: string) => void;
}) {
  const { formatBusinessDate, formatCurrency } = useGeneralSettings();
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const v = batch.variant;
  const remaining = batch.qtyRemaining ?? 0;
  const max = mode === "reduce" ? remaining : 9999;
  const label = `${(v as any)?.productType?.name ?? ""} ${(v as any)?.color?.name ?? ""}`.trim();

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        {mode === "add" ? "Add to Batch" : "Reduce from Batch"} — {label}
      </DialogTitle>
      <DialogContent sx={{ pt: "12px !important" }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Batch date: <strong>{formatBusinessDate(batch.createdAt)}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Batch remaining: <strong>{remaining}</strong> units
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Batch cost: <strong>{formatCurrency(batch.costPrice)}</strong> / Sell: <strong>{formatCurrency(batch.sellPrice)}</strong>
        </Typography>
        <TextField label="Quantity" type="number" value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value))))}
          fullWidth size="small" sx={{ mb: 2 }} slotProps={{ htmlInput: { min: 1, max } }} />
        <TextField select label="Reason" value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth size="small">
          {REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" size="small">Cancel</Button>
        <Button onClick={() => { if (reason) { onSubmit((v as any)?._id, batch._id, qty, reason); onClose(); } }}
          variant="contained" color={mode === "add" ? "primary" : "error"} size="small"
          disabled={!reason}>
          {mode === "add" ? "Add Stock" : "Reduce Stock"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Grid Card (batch-level) ──────────────────────────────────────────────
function BatchCard({ m, onAdd, onReduce }: { m: StockMovement; onAdd: () => void; onReduce: () => void }) {
  const { formatBusinessDate, formatCurrency } = useGeneralSettings();
  const v = m.variant as any;
  const remaining = m.qtyRemaining ?? 0;
  const stockColor = remaining === 0 ? "error.main" : remaining <= 5 ? "warning.main" : "success.main";
  const imageUrl = v ? getPrimaryImageUrl(v) : null;
  return (
    <Card sx={{ height: "100%", position: "relative", overflow: "hidden" }}>
      <Box sx={{ height: 120, bgcolor: "grey.200", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {imageUrl ? (
          <VariantImage src={imageUrl} alt={`${v?.productType?.name} ${v?.color?.name}`}
            width="100%" height="100%" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <ImagePlaceholder width={48} height={48} />
        )}
        {remaining === 0 && (
          <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(198,40,40,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.06em" }}>DEPLETED</Typography>
          </Box>
        )}
      </Box>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {v?.productType?.name} — {v?.color?.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {v?.category?.name}{v?.size !== "N/A" ? ` / ${v?.size}` : ""} · {formatBusinessDate(m.createdAt, "DD MMM")}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Remaining</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: stockColor }}>{remaining}</Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary">Cost</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(m.costPrice)}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5, mt: 1.5 }}>
          <Tooltip title="Add to this batch">
            <IconButton size="small" onClick={onAdd}
              sx={{ bgcolor: "success.main", color: "white", borderRadius: "6px" }}>
              <IconPlus size={14} stroke={2} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reduce from this batch">
            <span>
              <IconButton size="small" onClick={onReduce} disabled={remaining === 0}
                sx={{ bgcolor: "error.main", color: "white", borderRadius: "6px" }}>
                <IconMinus size={14} stroke={2} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function AllStockPage() {
  const router = useRouter();
  const { formatBusinessDate, formatCurrency } = useGeneralSettings();
  const [batches, setBatches] = useState<StockMovement[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [page, setPage] = useState(1);
  const [quickAction, setQuickAction] = useState<{ batch: StockMovement; mode: "add" | "reduce" } | null>(null);
  const [snackbar, setSnackbar] = useState("");

  useEffect(() => {
    api.getCategories().then((r: any) => setCategories(r.data ?? []));
  }, []);

  const fetchBatches = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(PER_PAGE) };
    if (catFilter) params.category = catFilter;
    if (search)    params.search   = search;

    api.getActiveBatches(params)
      .then((res: any) => {
        setBatches(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, catFilter, search]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const handleFilter = (fn: () => void) => { fn(); setPage(1); };

  const handleQuickSubmit = async (variantId: string, movementId: string, qty: number, reason: string) => {
    try {
      const mode = quickAction?.mode ?? "reduce";
      await api.adjust({
        variantId,
        adjustDirection: mode,
        qty,
        reason,
        movementId,
      });
      setSnackbar("Stock updated.");
      fetchBatches();
    } catch (err: any) {
      setSnackbar(err.message ?? "Failed.");
    }
  };

  return (
    <PageContainer title="All Stock" description="Inventory overview — batch level">
      <PageHeader
        title="All Stock"
        subtitle={`${total} active batches`}
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
              <ToggleButton value="list"><IconList size={16} /></ToggleButton>
              <ToggleButton value="grid"><IconLayoutGrid size={16} /></ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" startIcon={<IconPlus size={16} />} component={Link} href="/portal/inventory/stock-in" size="small">
              Stock In
            </Button>
          </Box>
        }
      />

      {/* Filter bar */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid size={{ xs: 6, sm: 4, md: "auto" }} sx={{ minWidth: 130 }}>
              <Select value={catFilter} onChange={(e) => handleFilter(() => setCatFilter(e.target.value))}
                size="small" fullWidth displayEmpty renderValue={(v) => v ? categories.find((c) => c._id === v)?.name : "Category"}>
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
              </Select>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: "auto" }}>
              <TextField placeholder="Search SKU…" value={search}
                onChange={(e) => handleFilter(() => setSearch(e.target.value))}
                size="small" fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment> } }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* List view */}
          {view === "list" && (
            <Card>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 48 }}>Img</TableCell>
                      <TableCell>Variant</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell>Batch Date</TableCell>
                      <TableCell align="center">Remaining</TableCell>
                      <TableCell align="right">Cost/Unit</TableCell>
                      <TableCell align="right">Sell/Unit</TableCell>
                      <TableCell align="right">Batch Value</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batches.map((m) => {
                      const v = m.variant as any;
                      const remaining = m.qtyRemaining ?? 0;
                      const total = getDisplayBatchTotal(m);
                      const batchValue = remaining * (m.costPrice ?? 0);
                      const pct = total > 0 ? remaining / total : 0;
                      const chipColor = pct === 0 ? "default" : pct < 0.25 ? "error" : pct < 0.75 ? "warning" : "success";
                      return (
                        <TableRow key={m._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                          <TableCell>
                            {v && getPrimaryImageUrl(v) ? (
                              <VariantImage src={getPrimaryImageUrl(v)} alt={v?.sku} width={32} height={32}
                                sx={{ width: 32, height: 32, objectFit: "cover", borderRadius: "8px" }} />
                            ) : (
                              <ImagePlaceholder width={32} height={32} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{v?.productType?.name} — {v?.color?.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {v?.category?.name}{v?.size !== "N/A" ? ` / ${v?.size}` : ""}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{v?.sku}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{formatBusinessDate(m.createdAt)}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={`${remaining} of ${total} units remaining in this batch`}>
                              <Chip label={`${remaining} / ${total}`} color={chipColor} size="small"
                                sx={{ fontWeight: 600, fontSize: "0.7rem", minWidth: 60 }} />
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{formatCurrency(m.costPrice)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(m.sellPrice)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(batchValue)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{m.supplier || "—"}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: "flex", gap: 0.25, justifyContent: "flex-end" }}>
                              <Tooltip title="Add to this batch">
                                <IconButton size="small" sx={{ color: "success.main" }}
                                  onClick={() => setQuickAction({ batch: m, mode: "add" })}>
                                  <IconPlus size={15} stroke={2} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reduce from this batch">
                                <span>
                                  <IconButton size="small" sx={{ color: "error.main" }} disabled={remaining === 0}
                                    onClick={() => setQuickAction({ batch: m, mode: "reduce" })}>
                                    <IconMinus size={15} stroke={2} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Stock history">
                                <IconButton size="small" sx={{ color: "text.secondary" }}
                                  onClick={() => router.push(`/portal/reports/stock-history?variant=${v?._id}`)}>
                                  <IconHistory size={15} stroke={1.5} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {batches.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>No active batches match the current filters.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          {/* Grid view */}
          {view === "grid" && (
            <Grid container spacing={2}>
              {batches.map((m) => (
                <Grid key={m._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <BatchCard m={m}
                    onAdd={() => setQuickAction({ batch: m, mode: "add" })}
                    onReduce={() => setQuickAction({ batch: m, mode: "reduce" })}
                  />
                </Grid>
              ))}
              {batches.length === 0 && (
                <Grid size={12}>
                  <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>No active batches match the current filters.</Box>
                </Grid>
              )}
            </Grid>
          )}
        </>
      )}

      {Math.ceil(total / PER_PAGE) > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination count={Math.ceil(total / PER_PAGE)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}

      {quickAction && (
        <QuickActionDialog
          batch={quickAction.batch}
          mode={quickAction.mode}
          onClose={() => setQuickAction(null)}
          onSubmit={handleQuickSubmit}
        />
      )}

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" onClose={() => setSnackbar("")}>{snackbar}</Alert>
      </Snackbar>
    </PageContainer>
  );
}
