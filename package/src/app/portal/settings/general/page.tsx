"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import PageContainer from "@/app/portal/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import { useGeneralSettings } from "@/context/GeneralSettingsContext";
import {
  CURRENCY_OPTIONS,
  formatCurrency as formatCurrencyValue,
  GENERAL_SETTINGS_DEFAULTS,
  TIMEZONE_OPTIONS,
  type GeneralSettings,
} from "@/lib/generalSettings";
import { SRI_LANKA_PROVINCES } from "@/lib/sriLankaGeo";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: "primary.dark", mb: 2.5 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

export default function GeneralSettingsPage() {
  const { settings, loading, updateSettings } = useGeneralSettings();
  const [form, setForm] = useState<GeneralSettings>(GENERAL_SETTINGS_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error">("success");

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const isDirty = useMemo(
    () =>
      form.currencyCode !== settings.currencyCode ||
      form.timezone !== settings.timezone ||
      form.defaultLowStockThreshold !== settings.defaultLowStockThreshold ||
      form.defaultDeliveryFee !== settings.defaultDeliveryFee ||
      JSON.stringify(form.deliveryPricing) !== JSON.stringify(settings.deliveryPricing) ||
      form.sellerWhatsappPhone !== settings.sellerWhatsappPhone,
    [form, settings]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        currencyCode: form.currencyCode,
        timezone: form.timezone,
        defaultLowStockThreshold: Number(form.defaultLowStockThreshold),
        defaultDeliveryFee: Number(form.defaultDeliveryFee),
        deliveryPricing: {
          provinceBaseFees: { ...form.deliveryPricing.provinceBaseFees },
          baseWeightGrams: Number(form.deliveryPricing.baseWeightGrams),
          additionalPerKgFee: Number(form.deliveryPricing.additionalPerKgFee),
        },
        sellerWhatsappPhone: form.sellerWhatsappPhone.trim(),
      });
      setSnackSeverity("success");
      setSnackMsg("General settings saved successfully.");
    } catch (err) {
      setSnackSeverity("error");
      setSnackMsg(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="General Settings" description="Business-wide operational defaults">
      <PageHeader
        title="General Settings"
        subtitle="Manage the shared currency, timezone, low-stock threshold, and delivery configurations."
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        Business profile, display preferences, and admin account controls are intentionally left out of this pass.
        This page saves only the settings that are now wired across inventory, orders, and finance.
      </Alert>

      <SectionCard title="Business Defaults">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              label="Currency"
              value={form.currencyCode}
              size="small"
              fullWidth
              disabled={loading}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, currencyCode: event.target.value as GeneralSettings["currencyCode"] }))
              }
              helperText={`Preview: ${formatCurrencyValue(1234.56, form.currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <MenuItem key={option.code} value={option.code}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              label="Timezone"
              value={form.timezone}
              size="small"
              fullWidth
              disabled={loading}
              onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
            >
              {TIMEZONE_OPTIONS.map((timezone) => (
                <MenuItem key={timezone} value={timezone}>
                  {timezone}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Operational Defaults">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Default Low Stock Threshold"
              type="number"
              value={form.defaultLowStockThreshold}
              size="small"
              fullWidth
              disabled={loading}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  defaultLowStockThreshold: Math.max(0, Number(event.target.value || 0)),
                }))
              }
              slotProps={{ htmlInput: { min: 0 } }}
              helperText="Used when creating a new variant unless staff enters a custom threshold."
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Seller WhatsApp Phone"
              value={form.sellerWhatsappPhone}
              size="small"
              fullWidth
              disabled={loading}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  sellerWhatsappPhone: event.target.value,
                }))
              }
              helperText='Used by public Bank Transfer checkout popup (example: +94770000000).'
            />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Delivery Configs">
        <Alert severity="info" sx={{ mb: 2 }}>
          Delivery formula: Province Base Fee + (each additional started 1000g above base threshold × Additional Fee).
        </Alert>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Default Delivery Fee"
              type="number"
              value={form.defaultDeliveryFee}
              size="small"
              fullWidth
              disabled={loading}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  defaultDeliveryFee: Math.max(0, Number(event.target.value || 0)),
                }))
              }
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              helperText="Used as the default manual delivery fee when creating new orders."
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Base Weight Threshold (g)"
              type="number"
              value={form.deliveryPricing.baseWeightGrams}
              size="small"
              fullWidth
              disabled={loading}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  deliveryPricing: {
                    ...prev.deliveryPricing,
                    baseWeightGrams: Math.max(1, Number(event.target.value || 1)),
                  },
                }))
              }
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              helperText="Base fee applies up to and including this weight."
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Additional Fee Per Extra Started KG"
              type="number"
              value={form.deliveryPricing.additionalPerKgFee}
              size="small"
              fullWidth
              disabled={loading}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  deliveryPricing: {
                    ...prev.deliveryPricing,
                    additionalPerKgFee: Math.max(0, Number(event.target.value || 0)),
                  },
                }))
              }
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              helperText="Applied for each additional started 1000g above base threshold."
            />
          </Grid>
          {SRI_LANKA_PROVINCES.map((province) => (
            <Grid key={province} size={{ xs: 12, md: 4 }}>
              <TextField
                label={`${province} Base Fee`}
                type="number"
                value={form.deliveryPricing.provinceBaseFees[province]}
                size="small"
                fullWidth
                disabled={loading}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    deliveryPricing: {
                      ...prev.deliveryPricing,
                      provinceBaseFees: {
                        ...prev.deliveryPricing.provinceBaseFees,
                        [province]: Math.max(0, Number(event.target.value || 0)),
                      },
                    },
                  }))
                }
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />
            </Grid>
          ))}
        </Grid>
      </SectionCard>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
        <Button
          variant="outlined"
          size="large"
          disabled={loading || saving || !isDirty}
          onClick={() => setForm(settings)}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          size="large"
          disabled={loading || saving || !isDirty}
          onClick={handleSave}
          sx={{ minWidth: 160 }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Box>

      <Snackbar
        open={!!snackMsg}
        autoHideDuration={3000}
        onClose={() => setSnackMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackSeverity} variant="filled" onClose={() => setSnackMsg("")}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
