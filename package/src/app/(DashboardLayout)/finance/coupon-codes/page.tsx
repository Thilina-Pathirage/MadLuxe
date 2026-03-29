"use client";

import { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Chip, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  RadioGroup, FormControlLabel, Radio, FormLabel, FormControl,
  Switch, Tooltip, Snackbar, Alert, InputAdornment, CircularProgress,
} from "@mui/material";
import { IconEdit, IconTrash, IconRefresh } from "@tabler/icons-react";
import dayjs from "dayjs";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import ConfirmDialog from "@/components/madlaxue/shared/ConfirmDialog";
import AppDatePicker from "@/components/madlaxue/shared/AppDatePicker";
import { useGeneralSettings } from "@/context/GeneralSettingsContext";
import { api } from "@/lib/api";
import { getCurrencyOption } from "@/lib/generalSettings";

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const EMPTY_FORM = {
  code: "", type: "percent" as "percent" | "fixed",
  value: "", minOrderValue: "", usageLimit: "", expiryDate: "",
};

export default function CouponCodesPage() {
  const { formatBusinessDate, formatCurrency, settings } = useGeneralSettings();
  const currencySymbol = getCurrencyOption(settings.currencyCode).symbol;
  const [coupons, setCoupons]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<any | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [snackMsg, setSnackMsg]     = useState("");

  const fetchCoupons = () => {
    setLoading(true);
    api.getCoupons().then((res: any) => setCoupons(res.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(""); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      code: c.code, type: c.type,
      value: String(c.value),
      minOrderValue: c.minOrderValue != null ? String(c.minOrderValue) : "",
      usageLimit:    c.usageLimit    != null ? String(c.usageLimit)    : "",
      expiryDate:    c.expiryDate ?? "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const validateForm = (): boolean => {
    if (!form.code.trim()) { setFormError("Code is required."); return false; }
    if (!form.value || Number(form.value) <= 0) { setFormError("Value must be > 0."); return false; }
    if (form.type === "percent" && Number(form.value) > 100) { setFormError("Percentage cannot exceed 100."); return false; }
    const conflict = coupons.find((c) => c.code === form.code.toUpperCase() && c._id !== editing?._id);
    if (conflict) { setFormError("This code already exists."); return false; }
    setFormError("");
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    const payload = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
      usageLimit:    form.usageLimit    ? Number(form.usageLimit)    : null,
      expiryDate:    form.expiryDate || null,
    };
    try {
      if (editing) {
        await api.updateCoupon(editing._id, payload);
        setSnackMsg(`Coupon "${payload.code}" updated.`);
      } else {
        await api.createCoupon(payload);
        setSnackMsg(`Coupon "${payload.code}" created.`);
      }
      setDialogOpen(false);
      fetchCoupons();
    } catch (err: any) {
      setFormError(err.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: any) => {
    await api.toggleCoupon(c._id);
    fetchCoupons();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.deleteCoupon(deleteTarget._id);
    setSnackMsg(`Coupon "${deleteTarget.code}" deleted.`);
    setDeleteTarget(null);
    fetchCoupons();
  };

  const isExpired = (c: any) => !!c.expiryDate && dayjs().isAfter(dayjs(c.expiryDate));

  return (
    <PageContainer title="Coupon Codes" description="Manage discount codes">
      <PageHeader
        title="Coupon Codes"
        subtitle={`${coupons.length} codes`}
        actions={<Button variant="contained" size="small" onClick={openAdd}>+ Create Coupon</Button>}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">Min Order</TableCell>
                  <TableCell>Expiry</TableCell>
                  <TableCell align="center">Usage / Limit</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coupons.map((c) => {
                  const expired = isExpired(c);
                  return (
                    <TableRow key={c._id} hover sx={{ "&:last-child td": { border: 0 }, opacity: !c.isActive ? 0.6 : 1 }}>
                      <TableCell>
                        <Typography sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.05em", color: "primary.dark" }}>
                          {c.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={c.type === "percent" ? "%" : currencySymbol} color={c.type === "percent" ? "info" : "success"} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {c.type === "percent" ? `${c.value}%` : formatCurrency(c.value)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {c.minOrderValue != null ? formatCurrency(c.minOrderValue) : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {c.expiryDate ? (
                          <Typography variant="caption" sx={{ color: expired ? "error.main" : "text.secondary", fontWeight: expired ? 600 : 400 }}>
                            {formatBusinessDate(c.expiryDate)}{expired && " (expired)"}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">No expiry</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{c.usedCount} / {c.usageLimit != null ? c.usageLimit : "∞"}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={c.isActive ? "Deactivate" : "Activate"}>
                          <Switch size="small" checked={c.isActive} onChange={() => toggleActive(c)} color="success" />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(c)} sx={{ color: "text.secondary" }}>
                            <IconEdit size={15} stroke={1.5} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => setDeleteTarget(c)} sx={{ color: "error.main" }}>
                            <IconTrash size={15} stroke={1.5} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {coupons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>No coupons yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{editing ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
        <DialogContent sx={{ pt: "12px !important" }}>
          <TextField
            label="Code" value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            size="small" fullWidth sx={{ mb: 2 }}
            helperText="Uppercase letters and numbers only"
            slotProps={{ input: { endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Generate random code">
                  <IconButton size="small" edge="end" onClick={() => setForm((f) => ({ ...f, code: randomCode() }))}>
                    <IconRefresh size={16} />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) } }}
          />
          <FormControl sx={{ mb: 2 }}>
            <FormLabel sx={{ fontSize: "0.8rem", fontWeight: 600, mb: 0.5 }}>Discount Type</FormLabel>
            <RadioGroup row value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "percent" | "fixed" }))}>
              <FormControlLabel value="percent" control={<Radio size="small" />} label="Percentage (%)" />
              <FormControlLabel value="fixed"   control={<Radio size="small" />} label={`Fixed Amount (${currencySymbol})`} />
            </RadioGroup>
          </FormControl>
          <TextField
            label="Value" type="number" value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            size="small" fullWidth sx={{ mb: 2 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">{form.type === "percent" ? "%" : currencySymbol}</InputAdornment> } }}
            inputProps={{ min: 0, max: form.type === "percent" ? 100 : undefined, step: 0.01 }}
          />
          <TextField
            label="Minimum Order Value" type="number" value={form.minOrderValue}
            onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))}
            size="small" fullWidth sx={{ mb: 2 }} helperText="Leave blank for no minimum"
            slotProps={{ input: { startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment> } }}
          />
          <TextField
            label="Usage Limit" type="number" value={form.usageLimit}
            onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
            size="small" fullWidth sx={{ mb: 2 }} helperText="Leave blank for unlimited"
            inputProps={{ min: 1 }}
          />
          <AppDatePicker label="Expiry Date" value={form.expiryDate}
            onChange={(v) => setForm((f) => ({ ...f, expiryDate: v }))} />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, mb: 1 }}>
            Leave blank for no expiry
          </Typography>
          {formError && <Alert severity="error" sx={{ mt: 1 }}>{formError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" disabled={saving}>
            {editing ? "Save Changes" : "Create Coupon"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Coupon"
        message={`Delete coupon "${deleteTarget?.code}"? This cannot be undone.`}
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
