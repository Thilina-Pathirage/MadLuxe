"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, IconButton, TextField,
  Select, MenuItem, InputAdornment, ToggleButtonGroup, ToggleButton,
  Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Pagination, Tooltip, CircularProgress,
} from "@mui/material";
import {
  IconSearch, IconPlus, IconMinus, IconList, IconLayoutGrid, IconHistory,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import StatusChip from "@/components/madlaxue/shared/StatusChip";
import ImagePlaceholder from "@/components/madlaxue/shared/ImagePlaceholder";
import VariantImage from "@/components/madlaxue/shared/VariantImage";
import { api } from "@/lib/api";
import { getPrimaryImageUrl } from "@/utils/variantImage";

const PER_PAGE = 25;

// ─── Quick Action Dialog ───────────────────────────────────────────────────
function QuickActionDialog({ variant, mode, onClose, onSubmit }: {
  variant: any; mode: "add" | "reduce"; onClose: () => void; onSubmit: (id: string, qty: number, note: string) => void;
}) {
  const [qty, setQty]   = useState(1);
  const [note, setNote] = useState("");
  const max = mode === "reduce" ? variant.stockQty : 9999;
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        {mode === "add" ? "Quick Stock In" : "Quick Reduce"} — {variant.productType?.name} {variant.color?.name}
      </DialogTitle>
      <DialogContent sx={{ pt: "12px !important" }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Current stock: <strong>{variant.stockQty}</strong> units
        </Typography>
        <TextField label="Quantity" type="number" value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value))))}
          fullWidth size="small" sx={{ mb: 2 }} slotProps={{ htmlInput: { min: 1, max } }} />
        <TextField label="Note (optional)" value={note}
          onChange={(e) => setNote(e.target.value)}
          fullWidth size="small" multiline rows={2} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" size="small">Cancel</Button>
        <Button onClick={() => { onSubmit(variant._id, qty, note); onClose(); }}
          variant="contained" color={mode === "add" ? "primary" : "error"} size="small">
          {mode === "add" ? "Add Stock" : "Reduce Stock"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Grid Card ─────────────────────────────────────────────────────────────
function StockCard({ v, onAdd, onReduce }: { v: any; onAdd: () => void; onReduce: () => void }) {
  const stockColor =
    v.status === "Out of Stock" ? "error.main" : v.status === "Low Stock" ? "warning.main" : "success.main";
  const imageUrl = getPrimaryImageUrl(v);
  return (
    <Card sx={{ height: "100%", position: "relative", overflow: "hidden" }}>
      <Box sx={{ height: 140, bgcolor: "grey.200", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {imageUrl ? (
          <VariantImage
            src={imageUrl}
            alt={`${v.productType?.name} ${v.color?.name}`}
            width="100%"
            height="100%"
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <ImagePlaceholder width={56} height={56} />
        )}
        {v.status === "Out of Stock" && (
          <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(198,40,40,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.06em" }}>OUT OF STOCK</Typography>
          </Box>
        )}
      </Box>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {v.productType?.name} — {v.color?.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">{v.category?.name}{v.size !== "N/A" ? ` / ${v.size}` : ""}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.25 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Stock</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: stockColor }}>{v.stockQty}</Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>Rs. {v.sellPrice?.toFixed(2)}</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5, mt: 1.5 }}>
          <Tooltip title="Add stock">
            <IconButton size="small" onClick={onAdd} sx={{ bgcolor: "success.main", color: "white", borderRadius: "6px" }}>
              <IconPlus size={14} stroke={2} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reduce stock">
            <span>
              <IconButton size="small" onClick={onReduce} disabled={v.stockQty === 0}
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

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function AllStockPage() {
  const router = useRouter();
  const [variants, setVariants]   = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [colors, setColors]       = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState<"list" | "grid">("list");
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sizeFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]           = useState(1);
  const [quickAction, setQuickAction] = useState<{ variant: any; mode: "add" | "reduce" } | null>(null);
  const [snackbar, setSnackbar]   = useState("");

  // Load filter options once
  useEffect(() => {
    api.getCategories().then((r: any) => setCategories(r.data ?? []));
    api.getColors().then((r: any) => setColors(r.data ?? []));
  }, []);

  useEffect(() => {
    if (catFilter) {
      api.getProductTypes(catFilter).then((r: any) => setProductTypes(r.data ?? []));
    } else {
      setProductTypes([]);
      setTypeFilter("");
    }
  }, [catFilter]);

  const fetchVariants = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(PER_PAGE) };
    if (catFilter)    params.category    = catFilter;
    if (typeFilter)   params.productType = typeFilter;
    if (sizeFilter)   params.size        = sizeFilter;
    if (colorFilter)  params.color       = colorFilter;
    if (search)       params.search      = search;
    if (statusFilter === "Low Stock" || statusFilter === "Out of Stock") params.lowStock = "true";

    api.getVariants(params)
      .then((res: any) => {
        let data = res.data ?? [];
        if (statusFilter === "Out of Stock") data = data.filter((v: any) => v.stockQty === 0);
        else if (statusFilter === "Low Stock") data = data.filter((v: any) => v.stockQty > 0 && v.status === "Low Stock");
        setVariants(data);
        setTotal(res.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, catFilter, typeFilter, sizeFilter, colorFilter, search, statusFilter]);

  useEffect(() => { fetchVariants(); }, [fetchVariants]);

  const handleFilter = (fn: () => void) => { fn(); setPage(1); };

  const handleQuickSubmit = async (variantId: string, qty: number, note: string) => {
    try {
      await api.adjust({ variantId, adjustDirection: "add", qty, reason: note || "Quick adjustment" });
      setSnackbar(`Stock updated.`);
      fetchVariants();
    } catch (err: any) {
      setSnackbar(err.message ?? "Failed.");
    }
  };

  return (
    <PageContainer title="All Stock" description="Inventory overview">
      <PageHeader
        title="All Stock"
        subtitle={`${total} variants`}
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
              <ToggleButton value="list"><IconList size={16} /></ToggleButton>
              <ToggleButton value="grid"><IconLayoutGrid size={16} /></ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" startIcon={<IconPlus size={16} />} component={Link} href="/inventory/stock-in" size="small">
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
              <Select value={catFilter} onChange={(e) => handleFilter(() => { setCatFilter(e.target.value); setTypeFilter(""); })}
                size="small" fullWidth displayEmpty renderValue={(v) => v ? categories.find((c) => c._id === v)?.name : "Category"}>
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
              </Select>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: "auto" }} sx={{ minWidth: 130 }}>
              <Select value={typeFilter} onChange={(e) => handleFilter(() => setTypeFilter(e.target.value))}
                size="small" fullWidth displayEmpty disabled={!catFilter}
                renderValue={(v) => v ? productTypes.find((t) => t._id === v)?.name : "Type"}>
                <MenuItem value="">All Types</MenuItem>
                {productTypes.map((t) => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
              </Select>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: "auto" }} sx={{ minWidth: 130 }}>
              <Select value={colorFilter} onChange={(e) => handleFilter(() => setColorFilter(e.target.value))}
                size="small" fullWidth displayEmpty renderValue={(v) => v ? colors.find((c) => c._id === v)?.name : "Color"}>
                <MenuItem value="">All Colors</MenuItem>
                {colors.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
              </Select>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: "auto" }} sx={{ minWidth: 130 }}>
              <Select value={statusFilter} onChange={(e) => handleFilter(() => setStatusFilter(e.target.value))}
                size="small" fullWidth displayEmpty renderValue={(v) => v || "Status"}>
                <MenuItem value="">All Statuses</MenuItem>
                {["In Stock", "Low Stock", "Out of Stock"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
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
                      <TableCell align="center">In Stock</TableCell>
                      <TableCell align="right">Cost Rs.</TableCell>
                      <TableCell align="right">Sell Rs.</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {variants.map((v) => (
                      <TableRow key={v._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                        <TableCell>
                          {getPrimaryImageUrl(v) ? (
                            <VariantImage
                              src={getPrimaryImageUrl(v)}
                              alt={v.sku}
                              width={32}
                              height={32}
                              sx={{ width: 32, height: 32, objectFit: "cover", borderRadius: "8px" }}
                            />
                          ) : (
                            <ImagePlaceholder width={32} height={32} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{v.productType?.name} — {v.color?.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {v.category?.name}{v.size !== "N/A" ? ` / ${v.size}` : ""}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{v.sku}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: v.status === "Out of Stock" ? "error.main" : v.status === "Low Stock" ? "warning.main" : "success.main" }}>
                            {v.stockQty}
                          </Typography>
                        </TableCell>
                        <TableCell align="right"><Typography variant="body2">Rs. {v.costPrice?.toFixed(2)}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>Rs. {v.sellPrice?.toFixed(2)}</Typography></TableCell>
                        <TableCell><StatusChip status={v.status} /></TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: "flex", gap: 0.25, justifyContent: "flex-end" }}>
                            <Tooltip title="Add stock">
                              <IconButton size="small" sx={{ color: "success.main" }}
                                onClick={() => setQuickAction({ variant: v, mode: "add" })}>
                                <IconPlus size={15} stroke={2} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reduce stock">
                              <span>
                                <IconButton size="small" sx={{ color: "error.main" }} disabled={v.stockQty === 0}
                                  onClick={() => setQuickAction({ variant: v, mode: "reduce" })}>
                                  <IconMinus size={15} stroke={2} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Stock history">
                              <IconButton size="small" sx={{ color: "text.secondary" }}
                                onClick={() => router.push(`/reports/stock-history?variant=${v._id}`)}>
                                <IconHistory size={15} stroke={1.5} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {variants.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>No variants match the current filters.</TableCell>
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
              {variants.map((v) => (
                <Grid key={v._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <StockCard v={v}
                    onAdd={() => setQuickAction({ variant: v, mode: "add" })}
                    onReduce={() => setQuickAction({ variant: v, mode: "reduce" })}
                  />
                </Grid>
              ))}
              {variants.length === 0 && (
                <Grid size={12}>
                  <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>No variants match the current filters.</Box>
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
          variant={quickAction.variant}
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
