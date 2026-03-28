"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, List, ListItem, ListItemText,
  ListItemSecondaryAction, IconButton, TextField, Button, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar,
  Tooltip, CircularProgress, Switch, FormControlLabel,
} from "@mui/material";
import { IconEdit, IconTrash, IconPlus, IconCheck } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import ConfirmDialog from "@/components/madlaxue/shared/ConfirmDialog";
import { api } from "@/lib/api";

/* ── Inline add row ── */
function InlineAdd({ onSave, placeholder, loading }: { onSave: (v: string) => void; placeholder?: string; loading?: boolean }) {
  const [val, setVal] = useState("");
  const submit = () => { if (val.trim()) { onSave(val.trim()); setVal(""); } };
  return (
    <Box sx={{ display: "flex", gap: 0.5, pt: 1 }}>
      <TextField size="small" fullWidth placeholder={placeholder ?? "New item…"}
        value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        disabled={loading}
      />
      <IconButton size="small" color="primary" disabled={!val.trim() || loading} onClick={submit}>
        {loading ? <CircularProgress size={14} /> : <IconCheck size={16} />}
      </IconButton>
    </Box>
  );
}

export default function ProductConfigPage() {
  /* ── Categories ── */
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [selCatId, setSelCatId] = useState("");

  /* ── Product Types ── */
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [selTypeId, setSelTypeId] = useState("");

  /* ── Colors ── */
  const [colors, setColors] = useState<any[]>([]);
  const [loadingColors, setLoadingColors] = useState(true);

  /* ── Edit dialog ── */
  const [editDialog, setEditDialog] = useState<{
    section: "category" | "type" | "color";
    id: string;
    name: string;
    hexCode?: string;
    hasSizes?: boolean;
    sizes?: string[];
  } | null>(null);

  /* ── Delete confirm ── */
  const [deleteTarget, setDeleteTarget] = useState<{ section: string; id: string; name: string } | null>(null);

  /* ── New color ── */
  const [newColorHex, setNewColorHex] = useState("#cccccc");

  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error">("success");

  const notify = (msg: string, sev: "success" | "error" = "success") => {
    setSnackMsg(msg); setSnackSeverity(sev);
  };

  /* ── Loaders ── */
  const fetchCategories = useCallback(() => {
    setLoadingCats(true);
    api.getCategories()
      .then((r: any) => {
        const cats = r.data ?? [];
        setCategories(cats);
        if (cats.length && !selCatId) setSelCatId(cats[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  const fetchTypes = useCallback(() => {
    if (!selCatId) { setProductTypes([]); return; }
    setLoadingTypes(true);
    api.getProductTypes(selCatId)
      .then((r: any) => {
        const types = r.data ?? [];
        setProductTypes(types);
        if (types.length && !selTypeId) setSelTypeId(types[0]._id);
        else if (!types.find((t: any) => t._id === selTypeId)) setSelTypeId(types[0]?._id ?? "");
      })
      .catch(() => {})
      .finally(() => setLoadingTypes(false));
  }, [selCatId]);

  const fetchColors = useCallback(() => {
    setLoadingColors(true);
    api.getColors()
      .then((r: any) => setColors(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingColors(false));
  }, []);

  useEffect(() => { fetchCategories(); fetchColors(); }, [fetchCategories, fetchColors]);
  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  /* ── Category CRUD ── */
  const addCategory = async (name: string) => {
    try {
      await api.createCategory({ name });
      notify(`Category "${name}" added.`);
      fetchCategories();
    } catch (err: any) { notify(err.message ?? "Failed.", "error"); }
  };

  /* ── Type CRUD ── */
  const addType = async (name: string) => {
    if (!selCatId) return;
    try {
      await api.createProductType({ name, category: selCatId });
      notify(`Type "${name}" added.`);
      fetchTypes();
    } catch (err: any) { notify(err.message ?? "Failed.", "error"); }
  };

  /* ── Color CRUD ── */
  const addColor = async (name: string) => {
    try {
      await api.createColor({ name, hexCode: newColorHex });
      notify(`Color "${name}" added.`);
      setNewColorHex("#cccccc");
      fetchColors();
    } catch (err: any) { notify(err.message ?? "Failed.", "error"); }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.section === "category") {
        await api.deleteCategory(deleteTarget.id);
      } else if (deleteTarget.section === "type") {
        await api.deleteProductType(deleteTarget.id);
        fetchTypes();
      } else if (deleteTarget.section === "color") {
        await api.deleteColor(deleteTarget.id);
        fetchColors();
      }
      if (deleteTarget.section === "category") fetchCategories();
      notify(`"${deleteTarget.name}" deleted.`);
    } catch (err: any) { notify(err.message ?? "Failed.", "error"); }
    setDeleteTarget(null);
  };

  /* ── Edit save ── */
  const handleEditSave = async () => {
    if (!editDialog) return;
    try {
      if (editDialog.section === "category") {
        await api.updateCategory(editDialog.id, { name: editDialog.name });
        fetchCategories();
      } else if (editDialog.section === "type") {
        await api.updateProductType(editDialog.id, {
          name: editDialog.name,
          hasSizes: editDialog.hasSizes,
          sizes: editDialog.sizes,
        });
        fetchTypes();
      } else if (editDialog.section === "color") {
        await api.updateColor(editDialog.id, { name: editDialog.name, hexCode: editDialog.hexCode });
        fetchColors();
      }
      notify("Saved.");
    } catch (err: any) { notify(err.message ?? "Failed.", "error"); }
    setEditDialog(null);
  };

  const selectedType = productTypes.find((t) => t._id === selTypeId);

  return (
    <PageContainer title="Product Config" description="Manage product dropdown values">
      <PageHeader title="Product Config" subtitle="Manage categories, types, sizes, and colours" />

      <Grid container spacing={2.5}>

        {/* ── Categories ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ color: "primary.dark", mb: 1.5 }}>Categories</Typography>
              {loadingCats ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={20} /></Box>
              ) : (
                <List dense disablePadding>
                  {categories.map((c) => (
                    <ListItem key={c._id} disablePadding sx={{ py: 0.5, borderBottom: "1px solid", borderColor: "rgba(196,198,207,0.2)" }}>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{c.name}</Typography>}
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small" sx={{ mr: 0.5 }}
                          onClick={() => setEditDialog({ section: "category", id: c._id, name: c.name })}>
                          <IconEdit size={14} stroke={1.5} />
                        </IconButton>
                        <IconButton size="small" sx={{ color: "error.main" }}
                          onClick={() => setDeleteTarget({ section: "category", id: c._id, name: c.name })}>
                          <IconTrash size={14} stroke={1.5} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {categories.length === 0 && (
                    <Typography variant="caption" color="text.disabled" sx={{ pl: 0.5 }}>No categories yet.</Typography>
                  )}
                </List>
              )}
              <InlineAdd onSave={addCategory} placeholder="New category name…" />
            </CardContent>
          </Card>
        </Grid>

        {/* ── Product Types ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="h6" sx={{ color: "primary.dark" }}>Types</Typography>
                <Select value={selCatId} size="small" sx={{ minWidth: 140 }} data-testid="types-category-select"
                  onChange={(e) => { setSelCatId(e.target.value); setSelTypeId(""); }}
                  displayEmpty renderValue={(v) => categories.find((c) => c._id === v)?.name ?? "Select category"}>
                  {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                </Select>
              </Box>
              {loadingTypes ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={20} /></Box>
              ) : (
                <List dense disablePadding>
                  {productTypes.map((t) => (
                    <ListItem key={t._id} disablePadding sx={{ py: 0.5, borderBottom: "1px solid", borderColor: "rgba(196,198,207,0.2)" }}>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{t.name}</Typography>}
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {t.hasSizes ? `Sizes: ${(t.sizes ?? []).join(", ") || "none"}` : "No sizes"}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small" sx={{ mr: 0.5 }}
                          onClick={() => setEditDialog({ section: "type", id: t._id, name: t.name, hasSizes: t.hasSizes, sizes: t.sizes ?? [] })}>
                          <IconEdit size={14} stroke={1.5} />
                        </IconButton>
                        <IconButton size="small" sx={{ color: "error.main" }}
                          onClick={() => setDeleteTarget({ section: "type", id: t._id, name: t.name })}>
                          <IconTrash size={14} stroke={1.5} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {productTypes.length === 0 && (
                    <Typography variant="caption" color="text.disabled" sx={{ pl: 0.5 }}>
                      {selCatId ? "No types for this category." : "Select a category first."}
                    </Typography>
                  )}
                </List>
              )}
              <InlineAdd onSave={addType} placeholder="New type name…" loading={!selCatId} />
            </CardContent>
          </Card>
        </Grid>

        {/* ── Sizes (edit via type) ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="h6" sx={{ color: "primary.dark" }}>Sizes</Typography>
                <Select value={selTypeId} size="small" sx={{ minWidth: 160 }} data-testid="sizes-type-select"
                  onChange={(e) => setSelTypeId(e.target.value)}
                  displayEmpty renderValue={(v) => productTypes.find((t) => t._id === v)?.name ?? "Select type"}>
                  {productTypes.map((t) => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
                </Select>
              </Box>
              {selectedType ? (
                <>
                  <FormControlLabel
                    control={
                      <Switch checked={selectedType.hasSizes ?? false} size="small" slotProps={{ input: { 'data-testid': 'has-sizes-switch' } }}
                        onChange={async (e) => {
                          try {
                            await api.updateProductType(selectedType._id, { hasSizes: e.target.checked, sizes: selectedType.sizes });
                            fetchTypes();
                          } catch { /* silent */ }
                        }} />
                    }
                    label={<Typography variant="body2">Has sizes</Typography>}
                    sx={{ mb: 1 }}
                  />
                  {selectedType.hasSizes && (
                    <>
                      <List dense disablePadding>
                        {(selectedType.sizes ?? []).map((s: string) => (
                          <ListItem key={s} disablePadding sx={{ py: 0.5, borderBottom: "1px solid", borderColor: "rgba(196,198,207,0.2)" }}>
                            <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{s === "N/A" ? "No size (N/A)" : s}</Typography>} />
                            <ListItemSecondaryAction>
                              <IconButton size="small" sx={{ color: "error.main" }}
                                onClick={async () => {
                                  const newSizes = (selectedType.sizes ?? []).filter((x: string) => x !== s);
                                  try {
                                    await api.updateProductType(selectedType._id, { sizes: newSizes });
                                    notify(`Size "${s}" removed.`);
                                    fetchTypes();
                                  } catch (err: any) { notify(err.message ?? "Failed.", "error"); }
                                }}>
                                <IconTrash size={14} stroke={1.5} />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                        {(selectedType.sizes ?? []).length === 0 && (
                          <Typography variant="caption" color="text.disabled" sx={{ pl: 0.5 }}>No sizes — add one below.</Typography>
                        )}
                      </List>
                      <InlineAdd placeholder="New size…" onSave={async (s) => {
                        const newSizes = [...(selectedType.sizes ?? []), s];
                        try {
                          await api.updateProductType(selectedType._id, { sizes: newSizes });
                          notify(`Size "${s}" added.`);
                          fetchTypes();
                        } catch (err: any) { notify(err.message ?? "Failed.", "error"); }
                      }} />
                    </>
                  )}
                </>
              ) : (
                <Typography variant="caption" color="text.disabled">Select a type to manage its sizes.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Colors ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ color: "primary.dark", mb: 1.5 }}>Colours</Typography>
              {loadingColors ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={20} /></Box>
              ) : (
                <List dense disablePadding>
                  {colors.map((c) => (
                    <ListItem key={c._id} disablePadding sx={{ py: 0.5, borderBottom: "1px solid", borderColor: "rgba(196,198,207,0.2)" }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: "3px", mr: 1.5, flexShrink: 0, bgcolor: c.hexCode ?? "#bdbdbd", border: "1px solid rgba(0,0,0,0.12)" }} />
                      <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{c.name}</Typography>}
                        secondary={<Typography variant="caption" color="text.disabled">{c.hexCode}</Typography>} />
                      <ListItemSecondaryAction>
                        <IconButton size="small" sx={{ mr: 0.5 }}
                          onClick={() => setEditDialog({ section: "color", id: c._id, name: c.name, hexCode: c.hexCode })}>
                          <IconEdit size={14} stroke={1.5} />
                        </IconButton>
                        <IconButton size="small" sx={{ color: "error.main" }}
                          onClick={() => setDeleteTarget({ section: "color", id: c._id, name: c.name })}>
                          <IconTrash size={14} stroke={1.5} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {colors.length === 0 && (
                    <Typography variant="caption" color="text.disabled" sx={{ pl: 0.5 }}>No colours yet.</Typography>
                  )}
                </List>
              )}
              <Box sx={{ display: "flex", gap: 1, pt: 1, alignItems: "center" }}>
                <Box component="input" type="color" value={newColorHex}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewColorHex(e.target.value)}
                  style={{ width: 36, height: 36, border: "none", background: "none", cursor: "pointer", padding: 0 }}
                />
                <Box sx={{ flex: 1 }}>
                  <InlineAdd placeholder="Colour name…" onSave={addColor} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Edit {editDialog?.section}</DialogTitle>
        <DialogContent sx={{ pt: "12px !important" }}>
          <TextField
            autoFocus fullWidth size="small" label="Name"
            value={editDialog?.name ?? ""}
            onChange={(e) => setEditDialog((d) => d ? { ...d, name: e.target.value } : d)}
            onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(); }}
            sx={{ mb: editDialog?.section === "color" ? 2 : 0 }}
          />
          {editDialog?.section === "color" && (
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <Box component="input" type="color" value={editDialog.hexCode ?? "#cccccc"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditDialog((d) => d ? { ...d, hexCode: e.target.value } : d)
                }
                style={{ width: 40, height: 40, border: "none", background: "none", cursor: "pointer", padding: 0 }}
              />
              <Typography variant="body2" color="text.secondary">{editDialog.hexCode}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialog(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" size="small" disabled={!editDialog?.name?.trim()}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Item"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar open={!!snackMsg} autoHideDuration={3000} onClose={() => setSnackMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackSeverity} variant="filled" onClose={() => setSnackMsg("")}>{snackMsg}</Alert>
      </Snackbar>
    </PageContainer>
  );
}
