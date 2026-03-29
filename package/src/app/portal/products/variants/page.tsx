"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, IconButton, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, Drawer, Snackbar, Alert, Tooltip, Chip, InputAdornment,
  Grid, CircularProgress, Pagination,
} from "@mui/material";
import {
  IconEdit, IconTrash, IconPhoto, IconHistory, IconPlus, IconSearch,
  IconStar, IconStarFilled, IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import PageContainer from "@/app/portal/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import StatusChip from "@/components/madlaxue/shared/StatusChip";
import ImagePlaceholder from "@/components/madlaxue/shared/ImagePlaceholder";
import VariantImage from "@/components/madlaxue/shared/VariantImage";
import ConfirmDialog from "@/components/madlaxue/shared/ConfirmDialog";
import { useGeneralSettings } from "@/context/GeneralSettingsContext";
import { api } from "@/lib/api";
import { getCurrencyOption } from "@/lib/generalSettings";
import { getPrimaryImageUrl, normalizeVariantImageUrl } from "@/utils/variantImage";

const PER_PAGE = 25;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

function formatVariantLabel(v: any) {
  const parts = [v.category?.name, v.productType?.name];
  if (v.size && v.size !== "N/A") parts.push(v.size);
  parts.push(v.color?.name);
  return parts.filter(Boolean).join(" / ");
}

// ─── Edit Prices Dialog ────────────────────────────────────────────────────
function EditPricesDialog({ variant, onSave, onClose }: {
  variant: any;
  onSave: (id: string, costPrice: number, sellPrice: number, lowStockThreshold: number) => void;
  onClose: () => void;
}) {
  const { settings } = useGeneralSettings();
  const currencySymbol = getCurrencyOption(settings.currencyCode).symbol;
  const [cost, setCost]     = useState(String(variant.costPrice));
  const [sell, setSell]     = useState(String(variant.sellPrice));
  const [thresh, setThresh] = useState(String(variant.lowStockThreshold));
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Edit Variant Prices</DialogTitle>
      <DialogContent sx={{ pt: "12px !important" }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {formatVariantLabel(variant)}
        </Typography>
        <TextField label="Cost Price" type="number" value={cost} size="small" fullWidth
          onChange={(e) => setCost(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> }, htmlInput: { min: 0, step: 0.01 } }}
          sx={{ mb: 2 }} />
        <TextField label="Sell Price" type="number" value={sell} size="small" fullWidth
          onChange={(e) => setSell(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> }, htmlInput: { min: 0, step: 0.01 } }}
          sx={{ mb: 2 }} />
        <TextField label="Low Stock Threshold (units)" type="number" value={thresh} size="small" fullWidth
          onChange={(e) => setThresh(e.target.value)}
          slotProps={{ htmlInput: { min: 0 } }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" size="small">Cancel</Button>
        <Button
          onClick={() => { onSave(variant._id, Number(cost), Number(sell), Number(thresh)); onClose(); }}
          variant="contained" size="small"
        >Save</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Image Manager Drawer ──────────────────────────────────────────────────
function ImageManagerDrawer({ variant, onClose, onUpdate }: {
  variant: any;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [imagesDraft, setImagesDraft] = useState<any[]>(variant.images ?? []);
  const [pendingUpload, setPendingUpload] = useState<PendingImage | null>(null);
  const [pendingPrimaryId, setPendingPrimaryId] = useState<string | null>(
    (variant.images ?? []).find((img: any) => img.isPrimary)?._id ?? null
  );
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (pendingUpload?.previewUrl) URL.revokeObjectURL(pendingUpload.previewUrl);
    };
  }, [pendingUpload]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Only PNG, JPG and WebP images are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be 5MB or smaller.");
      e.target.value = "";
      return;
    }

    if (pendingUpload?.previewUrl) URL.revokeObjectURL(pendingUpload.previewUrl);

    setPendingUpload({
      id: `drawer-${file.name}-${file.lastModified}`,
      file,
      previewUrl: URL.createObjectURL(file),
    });
    setError("");
    e.target.value = "";
  };

  const handleSetPrimary = (imgId: string) => {
    setPendingPrimaryId(imgId);
    setImagesDraft((prev) => prev.map((img) => ({ ...img, isPrimary: img._id === imgId })));
  };

  const handleDelete = (imgId: string) => {
    setImagesDraft((prev) => {
      const next = prev.filter((img) => img._id !== imgId);
      if (pendingPrimaryId === imgId) {
        setPendingPrimaryId(next[0]?._id ?? null);
        if (next[0]?._id) {
          return next.map((img, idx) => ({ ...img, isPrimary: idx === 0 }));
        }
      }
      return next;
    });
    setPendingDeleteIds((prev) => new Set(prev).add(imgId));
  };

  const removePendingUpload = () => {
    if (pendingUpload?.previewUrl) URL.revokeObjectURL(pendingUpload.previewUrl);
    setPendingUpload(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      let latestImages = imagesDraft;
      const existingImageIds = new Set((variant.images ?? []).map((img: any) => img._id));

      if (pendingUpload) {
        const uploaded: any = await api.uploadImages(variant._id, [pendingUpload.file]);
        latestImages = uploaded.data ?? latestImages;
      }

      const persistedPrimary = latestImages.find((img: any) => img.isPrimary)?._id ?? null;
      if (pendingPrimaryId && pendingPrimaryId !== persistedPrimary) {
        const updatedPrimary: any = await api.setPrimaryImage(variant._id, pendingPrimaryId);
        latestImages = updatedPrimary.data ?? latestImages;
      }

      for (const imgId of Array.from(pendingDeleteIds)) {
        if (!existingImageIds.has(imgId)) continue;
        const afterDelete: any = await api.deleteImage(variant._id, imgId);
        latestImages = afterDelete.data ?? latestImages;
      }

      if (pendingUpload?.previewUrl) URL.revokeObjectURL(pendingUpload.previewUrl);
      setPendingUpload(null);
      setPendingDeleteIds(new Set());
      setImagesDraft(latestImages);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to save image changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer anchor="right" open onClose={onClose} PaperProps={{ sx: { width: 360, overflowX: "hidden" } }}>
      <Box sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", overflowX: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.dark" }}>
            Manage Images
          </Typography>
          <IconButton size="small" onClick={onClose}><IconX size={18} /></IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {formatVariantLabel(variant)}
        </Typography>

        <Box
          sx={{
            border: "2px dashed", borderColor: "grey.300", borderRadius: "10px",
            p: 3, textAlign: "center", mb: 2.5, cursor: "pointer",
            "&:hover": { borderColor: "primary.main", bgcolor: "primary.light" },
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <IconPhoto size={28} stroke={1.5} style={{ color: "#9e9e9e", marginBottom: 8 }} />
          <Typography variant="body2" color="text.secondary">
            Click to upload or <Typography component="span" color="primary.main" sx={{ fontWeight: 600 }}>Browse</Typography>
          </Typography>
          <Typography variant="caption" color="text.disabled">PNG, JPG up to 5MB</Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={handleFileChange}
          />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {pendingUpload && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
              Pending upload (not saved yet)
            </Typography>
            <Box sx={{ position: "relative", width: "100%", maxWidth: 160 }}>
              <Box
                component="img"
                src={pendingUpload.previewUrl}
                alt={pendingUpload.file.name}
                sx={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "8px", border: "1px solid", borderColor: "divider" }}
              />
              <IconButton
                size="small"
                onClick={removePendingUpload}
                sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(255,255,255,0.9)", p: 0.25, color: "error.main" }}
              >
                <IconTrash size={14} />
              </IconButton>
            </Box>
          </Box>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1, flex: 1, alignContent: "start" }}>
          {imagesDraft.length > 0 ? imagesDraft.map((img: any) => (
            <Box key={img._id} sx={{ position: "relative" }}>
              <VariantImage
                src={normalizeVariantImageUrl(img.url)}
                alt="Variant image"
                width="100%"
                height="100%"
                sx={{
                  width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "8px",
                  border: img.isPrimary ? "2px solid" : "2px solid transparent",
                  borderColor: img.isPrimary ? "primary.main" : "transparent",
                }}
              />
              <Box sx={{ position: "absolute", top: 2, right: 2, display: "flex", gap: 0.25 }}>
                <IconButton size="small" onClick={() => handleSetPrimary(img._id)}
                  sx={{ bgcolor: "rgba(255,255,255,0.9)", p: 0.25, color: pendingPrimaryId === img._id ? "#f9a825" : "grey.400" }}>
                  {pendingPrimaryId === img._id ? <IconStarFilled size={14} /> : <IconStar size={14} />}
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(img._id)}
                  sx={{ bgcolor: "rgba(255,255,255,0.9)", p: 0.25, color: "error.main" }}>
                  <IconTrash size={14} />
                </IconButton>
              </Box>
            </Box>
          )) : (
            Array.from({ length: 6 }, (_, i) => (
              <Box key={i} sx={{ width: "100%", aspectRatio: "1", bgcolor: "grey.200", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ImagePlaceholder width={32} height={32} />
              </Box>
            ))
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, pt: 2, mt: "auto" }}>
          <Button onClick={onClose} variant="outlined" size="small" fullWidth disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" fullWidth disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

// ─── New Variant Dialog ────────────────────────────────────────────────────
function NewVariantDialog({ categories, colors, onClose, onSave }: {
  categories: any[];
  colors: any[];
  onClose: () => void;
  onSave: () => void;
}) {
  const { settings } = useGeneralSettings();
  const currencySymbol = getCurrencyOption(settings.currencyCode).symbol;
  const [catId, setCatId]     = useState("");
  const [typeId, setTypeId]   = useState("");
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [size, setSize]       = useState("");
  const [colorId, setColorId] = useState("");
  const [cost, setCost]       = useState("");
  const [sell, setSell]       = useState("");
  const [initQty, setInitQty] = useState("");
  const [thresh, setThresh]   = useState(String(settings.defaultLowStockThreshold));
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const fileInputRef          = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!catId) { setProductTypes([]); setTypeId(""); setSize(""); return; }
    api.getProductTypes(catId).then((r: any) => setProductTypes(r.data ?? []));
    setTypeId(""); setSize("");
  }, [catId]);

  useEffect(() => {
    return () => {
      if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    };
  }, [pendingImage]);

  useEffect(() => {
    setThresh(String(settings.defaultLowStockThreshold));
  }, [settings.defaultLowStockThreshold]);

  const selectedType = productTypes.find((t) => t._id === typeId);
  const sizeOptions  = selectedType?.hasSizes ? selectedType.sizes : ["N/A"];
  const canSave      = catId && typeId && size && colorId && cost && sell;

  useEffect(() => {
    if (!selectedType) return;
    if (!selectedType.hasSizes) {
      setSize("N/A");
      return;
    }
    if (selectedType.sizes?.length === 1) {
      setSize(selectedType.sizes[0]);
    }
  }, [selectedType]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Only PNG, JPG and WebP images are allowed.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    });
    setError("");
    event.target.value = "";
  };

  const handleRemoveImage = () => {
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const form = new FormData();
      form.append("categoryId", catId);
      form.append("productTypeId", typeId);
      form.append("colorId", colorId);
      form.append("size", size);
      form.append("costPrice", String(Number(cost)));
      form.append("sellPrice", String(Number(sell)));
      form.append("stockQty", String(Number(initQty) || 0));
      form.append("lowStockThreshold", String(Number(thresh) || settings.defaultLowStockThreshold));
      if (pendingImage) form.append("images", pendingImage.file);

      await api.createVariant(form);
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to create variant.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>New Variant</DialogTitle>
      <DialogContent sx={{ pt: "12px !important" }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid size={6}>
            <TextField select label="Category" value={catId} size="small" fullWidth
              onChange={(e) => { setCatId(e.target.value); }}>
              {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={6}>
            <TextField select label="Type" value={typeId} size="small" fullWidth disabled={!catId}
              onChange={(e) => { setTypeId(e.target.value); setSize(""); }}>
              {productTypes.map((t) => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={6}>
            <TextField select label="Size" value={size} size="small" fullWidth disabled={!typeId}
              onChange={(e) => setSize(e.target.value)}>
              {sizeOptions.map((s: string) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={6}>
            <TextField select label="Color" value={colorId} size="small" fullWidth
              onChange={(e) => setColorId(e.target.value)}>
              {colors.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={6}>
            <TextField label="Cost Price" type="number" value={cost} size="small" fullWidth
              onChange={(e) => setCost(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> } }} />
          </Grid>
          <Grid size={6}>
            <TextField label="Sell Price" type="number" value={sell} size="small" fullWidth
              onChange={(e) => setSell(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> } }} />
          </Grid>
          <Grid size={6}>
            <TextField label="Initial Stock Qty" type="number" value={initQty} size="small" fullWidth
              onChange={(e) => setInitQty(e.target.value)}
              slotProps={{ htmlInput: { min: 0 } }} />
          </Grid>
          <Grid size={6}>
            <TextField label="Low Stock Threshold" type="number" value={thresh} size="small" fullWidth
              onChange={(e) => setThresh(e.target.value)}
              slotProps={{ htmlInput: { min: 0 } }} />
          </Grid>
          <Grid size={12}>
            <Box
              sx={{
                border: "2px dashed",
                borderColor: "grey.300",
                borderRadius: "10px",
                p: 2,
                cursor: "pointer",
                "&:hover": { borderColor: "primary.main", bgcolor: "primary.light" },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.dark", mb: 0.5 }}>
                Variant Images
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click to upload an image for this variant
              </Typography>
              <Typography variant="caption" color="text.disabled">
                PNG, JPG, WebP up to 5MB
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handleImageSelect}
              />
            </Box>
          </Grid>
          {pendingImage && (
            <Grid size={12}>
              <Box sx={{ position: "relative", width: "100%", maxWidth: 180 }}>
                <Box
                  component="img"
                  src={pendingImage.previewUrl}
                  alt={pendingImage.file.name}
                  sx={{
                    width: "100%",
                    aspectRatio: "1",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "2px solid",
                    borderColor: "primary.main",
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleRemoveImage}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "rgba(255,255,255,0.92)",
                    color: "error.main",
                    p: 0.25,
                  }}
                >
                  <IconX size={14} />
                </IconButton>
                <Chip
                  label="Primary"
                  size="small"
                  color="primary"
                  sx={{ position: "absolute", left: 6, bottom: 6, height: 22 }}
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" size="small">Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={!canSave || saving}>
          {saving ? "Saving…" : "Add Variant"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function VariantsPage() {
  const router = useRouter();
  const { formatCurrency } = useGeneralSettings();

  const [variants, setVariants] = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);

  const [categories, setCategories]   = useState<any[]>([]);
  const [colors, setColors]           = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);

  const [catFilter, setCatFilter]   = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);

  const [editTarget, setEditTarget]     = useState<any | null>(null);
  const [imageTarget, setImageTarget]   = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [newVariantOpen, setNewVariantOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");

  const totalPages = Math.ceil(total / PER_PAGE);

  // Load static options
  useEffect(() => {
    api.getCategories().then((r: any) => setCategories(r.data ?? []));
    api.getColors().then((r: any) => setColors(r.data ?? []));
  }, []);

  // Cascade: load product types when category filter changes
  useEffect(() => {
    if (!catFilter) { setProductTypes([]); setTypeFilter(""); return; }
    api.getProductTypes(catFilter).then((r: any) => setProductTypes(r.data ?? []));
    setTypeFilter("");
  }, [catFilter]);

  const fetchVariants = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(PER_PAGE) };
    if (catFilter)   params.category    = catFilter;
    if (typeFilter)  params.productType = typeFilter;
    if (colorFilter) params.color       = colorFilter;
    if (sizeFilter)  params.size        = sizeFilter;
    if (search)      params.search      = search;
    api.getVariants(params)
      .then((r) => { setVariants(r.data ?? []); setTotal(r.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [catFilter, typeFilter, colorFilter, sizeFilter, search, page]);

  useEffect(() => { fetchVariants(); }, [fetchVariants]);

  const handlePriceSave = async (id: string, costPrice: number, sellPrice: number, lowStockThreshold: number) => {
    try {
      await api.updateVariant(id, { costPrice, sellPrice, lowStockThreshold } as any);
      setSnackMsg("Prices updated.");
      fetchVariants();
    } catch (err: any) {
      setSnackMsg(err.message ?? "Failed.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteVariant(deleteTarget._id);
      setSnackMsg("Variant deleted.");
      fetchVariants();
    } catch (err: any) {
      setSnackMsg(err.message ?? "Failed.");
    }
    setDeleteTarget(null);
  };

  const handleFilter = (fn: () => void) => { fn(); setPage(1); };

  const SIZE_OPTIONS = ["All", "N/A", "Single", "King", "Superking"];

  return (
    <PageContainer title="Variants" description="All product variants">
      <PageHeader
        title="Variants"
        subtitle={`${total} variants`}
        actions={
          <Button variant="contained" size="small" startIcon={<IconPlus size={16} />}
            onClick={() => setNewVariantOpen(true)}>
            New Variant
          </Button>
        }
      />

      {/* Filter row */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
            <Select value={catFilter || "All"} size="small" sx={{ minWidth: 130 }}
              onChange={(e) => handleFilter(() => setCatFilter(e.target.value === "All" ? "" : e.target.value))}
              renderValue={(v) => v === "All" ? "Category" : categories.find((c) => c._id === v)?.name ?? v}>
              <MenuItem value="All">All Categories</MenuItem>
              {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
            </Select>
            <Select value={typeFilter || "All"} size="small" sx={{ minWidth: 130 }}
              onChange={(e) => handleFilter(() => setTypeFilter(e.target.value === "All" ? "" : e.target.value))}
              disabled={!catFilter}
              renderValue={(v) => v === "All" ? "Type" : productTypes.find((t) => t._id === v)?.name ?? v}>
              <MenuItem value="All">All Types</MenuItem>
              {productTypes.map((t) => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
            </Select>
            <Select value={sizeFilter || "All"} size="small" sx={{ minWidth: 100 }}
              onChange={(e) => handleFilter(() => setSizeFilter(e.target.value === "All" ? "" : e.target.value))}
              renderValue={(v) => v === "All" ? "Size" : v as string}>
              {SIZE_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
            <Select value={colorFilter || "All"} size="small" sx={{ minWidth: 120 }}
              onChange={(e) => handleFilter(() => setColorFilter(e.target.value === "All" ? "" : e.target.value))}
              renderValue={(v) => v === "All" ? "Color" : colors.find((c) => c._id === v)?.name ?? v}>
              <MenuItem value="All">All Colors</MenuItem>
              {colors.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
            </Select>
            <TextField
              placeholder="Search SKU, type, colour…" value={search}
              onChange={(e) => handleFilter(() => setSearch(e.target.value))}
              size="small" sx={{ minWidth: 220 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment> } }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 48 }}>Image</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Color</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell align="right">Sell</TableCell>
                <TableCell align="center">Stock</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}><CircularProgress size={24} /></TableCell>
                </TableRow>
              ) : variants.map((v) => {
                const stockColor = v.status === "Out of Stock" ? "error.main" : v.status === "Low Stock" ? "warning.main" : "success.main";
                const primaryImageUrl = getPrimaryImageUrl(v);
                return (
                  <TableRow key={v._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      {primaryImageUrl ? (
                        <VariantImage
                          src={primaryImageUrl}
                          alt={formatVariantLabel(v)}
                          width={32}
                          height={32}
                          sx={{ width: 32, height: 32, objectFit: "cover", borderRadius: "8px" }}
                        />
                      ) : (
                        <ImagePlaceholder width={32} height={32} />
                      )}
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{v.category?.name}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{v.productType?.name}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{v.size}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{v.color?.name}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>{v.sku}</Typography>
                    </TableCell>
                    <TableCell align="right"><Typography variant="body2">{formatCurrency(v.costPrice)}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(v.sellPrice)}</Typography></TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: stockColor }}>{v.stockQty}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 0.25, justifyContent: "flex-end" }}>
                        <Tooltip title="Edit prices">
                          <IconButton size="small" sx={{ color: "primary.main" }} onClick={() => setEditTarget(v)}>
                            <IconEdit size={15} stroke={1.5} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Manage images">
                          <IconButton size="small" sx={{ color: "text.secondary" }} onClick={() => setImageTarget(v)}>
                            <IconPhoto size={15} stroke={1.5} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Stock history">
                          <IconButton size="small" sx={{ color: "text.secondary" }}
                            onClick={() => router.push(`/portal/reports/stock-history?variant=${v._id}`)}>
                            <IconHistory size={15} stroke={1.5} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" sx={{ color: "error.main" }} onClick={() => setDeleteTarget(v)}>
                            <IconTrash size={15} stroke={1.5} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && variants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No variants match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" size="small" />
          </Box>
        )}
      </Card>

      {editTarget && (
        <EditPricesDialog variant={editTarget} onSave={handlePriceSave} onClose={() => setEditTarget(null)} />
      )}
      {imageTarget && (
        <ImageManagerDrawer variant={imageTarget} onClose={() => setImageTarget(null)} onUpdate={fetchVariants} />
      )}
      {newVariantOpen && (
        <NewVariantDialog
          categories={categories} colors={colors}
          onClose={() => setNewVariantOpen(false)}
          onSave={() => { setSnackMsg("Variant created."); fetchVariants(); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Variant"
        message={`Delete ${deleteTarget ? formatVariantLabel(deleteTarget) : ""}? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar open={!!snackMsg} autoHideDuration={3000} onClose={() => setSnackMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" onClose={() => setSnackMsg("")}>{snackMsg}</Alert>
      </Snackbar>
    </PageContainer>
  );
}
