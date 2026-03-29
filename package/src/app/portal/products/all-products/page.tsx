"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Chip, IconButton, TextField,
  Select, MenuItem, Button, Collapse, Snackbar, Alert, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, InputAdornment, CircularProgress,
} from "@mui/material";
import {
  IconChevronDown, IconChevronUp, IconSearch, IconPlus, IconEdit, IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import PageContainer from "@/app/portal/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import StatusChip from "@/components/madlaxue/shared/StatusChip";
import ImagePlaceholder from "@/components/madlaxue/shared/ImagePlaceholder";
import VariantImage from "@/components/madlaxue/shared/VariantImage";
import { useGeneralSettings } from "@/context/GeneralSettingsContext";
import { api } from "@/lib/api";
import { getPrimaryImageUrl } from "@/utils/variantImage";

export default function AllProductsPage() {
  const { formatCurrency } = useGeneralSettings();
  const [variants, setVariants] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [snackMsg, setSnackMsg] = useState("");

  // New type dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCatId, setNewCatId] = useState("");
  const [newType, setNewType] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getCategories().then((r: any) => setCategories(r.data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: "500" };
    if (catFilter !== "All") params.category = catFilter;
    api.getVariants(params)
      .then((r) => setVariants(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [catFilter]);

  // Group variants by category name → type name
  const groups = useMemo(() => {
    const map: Record<string, Record<string, any[]>> = {};
    variants.forEach((v) => {
      const cat = v.category?.name ?? "Unknown";
      const type = v.productType?.name ?? "Unknown";
      if (!map[cat]) map[cat] = {};
      if (!map[cat][type]) map[cat][type] = [];
      map[cat][type].push(v);
    });
    return Object.entries(map).map(([cat, types]) => ({
      category: cat,
      types: Object.entries(types).map(([typeName, vars]) => ({ typeName, variants: vars })),
    }));
  }, [variants]);

  const filtered = useMemo(() =>
    groups
      .map((g) => ({
        ...g,
        types: g.types.filter((t) =>
          !search ||
          t.typeName.toLowerCase().includes(search.toLowerCase()) ||
          g.category.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((g) => g.types.length > 0),
    [groups, search]
  );

  const toggleRow = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleAddType = async () => {
    if (!newCatId || !newType) return;
    setSaving(true);
    try {
      await api.createProductType({ name: newType, category: newCatId });
      setSnackMsg(`Product type "${newType}" created.`);
      setDialogOpen(false);
      setNewCatId(""); setNewType("");
    } catch (err: any) {
      setSnackMsg(err.message ?? "Failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="All Products" description="Product types grouped by category">
      <PageHeader
        title="All Products"
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" size="small" startIcon={<IconPlus size={16} />}
              onClick={() => setDialogOpen(true)}>
              New Product Type
            </Button>
          </Box>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <Select
              value={catFilter} size="small" sx={{ minWidth: 160 }}
              onChange={(e) => setCatFilter(e.target.value)}
              displayEmpty
              renderValue={(v) => v === "All" ? "All Categories" : categories.find((c) => c._id === v)?.name ?? v}
            >
              <MenuItem value="All">All Categories</MenuItem>
              {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
            </Select>
            <TextField
              placeholder="Search category or type…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              size="small" sx={{ minWidth: 260 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment> } }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40 }} />
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="center">Variants</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : filtered.flatMap((g) =>
                g.types.map((t) => {
                  const key = `${g.category}__${t.typeName}`;
                  const isOpen = expanded.has(key);
                  const variantCount = t.variants.length;

                  return [
                    <TableRow key={key} hover sx={{ cursor: "pointer" }}>
                      <TableCell onClick={() => toggleRow(key)} sx={{ pr: 0 }}>
                        <IconButton size="small">
                          {isOpen ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        </IconButton>
                      </TableCell>
                      <TableCell onClick={() => toggleRow(key)}>
                        <Typography variant="body2" color="text.secondary">{g.category}</Typography>
                      </TableCell>
                      <TableCell onClick={() => toggleRow(key)}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.typeName}</Typography>
                      </TableCell>
                      <TableCell align="center" onClick={() => toggleRow(key)}>
                        <Chip label={variantCount} size="small" sx={{ bgcolor: "primary.light", color: "primary.dark", fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Add variant">
                          <IconButton size="small" component={Link} href="/portal/products/variants" sx={{ color: "primary.main" }}>
                            <IconPlus size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" sx={{ color: "text.secondary" }}>
                            <IconEdit size={16} stroke={1.5} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={variantCount > 0 ? "Cannot delete — has variants" : "Delete"}>
                          <span>
                            <IconButton size="small" disabled={variantCount > 0} sx={{ color: "error.main" }}>
                              <IconTrash size={16} stroke={1.5} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>,

                    <TableRow key={`${key}__expanded`}>
                      <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                        <Collapse in={isOpen} unmountOnExit>
                          <Box sx={{ bgcolor: "grey.100", px: 3, py: 1.5 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  {[
                                    { label: "Image" },
                                    { label: "Color" },
                                    { label: "Size" },
                                    { label: "SKU" },
                                    { label: "Stock", align: "center" as const },
                                    { label: "Sell", align: "right" as const },
                                    { label: "Status" },
                                  ].map(({ label, align }) => (
                                    <TableCell key={label} align={align}
                                      sx={{ bgcolor: "transparent", border: 0, fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary" }}>
                                      {label}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {t.variants.map((v: any) => {
                                  const imageUrl = getPrimaryImageUrl(v);
                                  return (
                                    <TableRow key={v._id} sx={{ "&:last-child td": { border: 0 } }}>
                                      <TableCell sx={{ bgcolor: "transparent" }}>
                                        {imageUrl ? (
                                          <VariantImage
                                            src={imageUrl}
                                            alt={`${t.typeName} ${v.color?.name ?? ""} ${v.size ?? ""}`.trim()}
                                            width={32}
                                            height={32}
                                            sx={{ width: 32, height: 32, objectFit: "cover", borderRadius: "8px" }}
                                          />
                                        ) : (
                                          <ImagePlaceholder width={32} height={32} />
                                        )}
                                      </TableCell>
                                      <TableCell sx={{ bgcolor: "transparent" }}>
                                        <Typography variant="body2">{v.color?.name}</Typography>
                                      </TableCell>
                                      <TableCell sx={{ bgcolor: "transparent" }}>
                                        <Typography variant="body2" color="text.secondary">{v.size}</Typography>
                                      </TableCell>
                                      <TableCell sx={{ bgcolor: "transparent" }}>
                                        <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{v.sku}</Typography>
                                      </TableCell>
                                      <TableCell align="center" sx={{ bgcolor: "transparent" }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{v.stockQty}</Typography>
                                      </TableCell>
                                      <TableCell align="right" sx={{ bgcolor: "transparent" }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(v.sellPrice)}</Typography>
                                      </TableCell>
                                      <TableCell sx={{ bgcolor: "transparent" }}>
                                        <StatusChip status={v.status} />
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>,
                  ];
                })
              )}

              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No product types found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>New Product Type</DialogTitle>
        <DialogContent sx={{ pt: "12px !important" }}>
          <TextField
            select label="Category" value={newCatId} size="small" fullWidth sx={{ mb: 2 }}
            onChange={(e) => setNewCatId(e.target.value)}
          >
            {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField
            label="Type Name" value={newType} size="small" fullWidth
            onChange={(e) => setNewType(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleAddType} variant="contained" size="small" disabled={!newCatId || !newType || saving}>
            {saving ? "Saving…" : "Add Type"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackMsg} autoHideDuration={3500} onClose={() => setSnackMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" onClose={() => setSnackMsg("")}>{snackMsg}</Alert>
      </Snackbar>
    </PageContainer>
  );
}
