"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { customerApi } from "@/lib/customerApi";
import { useCustomerAuth } from "@/lib/customerAuth";
import { SRI_LANKA_PROVINCES, getDistricts } from "@/lib/sriLankaGeo";

const PHONE_MAX = 9;

export default function ShopProfilePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = "#C9A84C";
  const textPrimary = isDark ? "#F0EDE8" : "#111111";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#333333", 0.68);
  const cardBg = isDark ? alpha("#0d1410", 0.72) : "#FFFFFF";
  const border = isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.08);

  const { customer, loading: authLoading, setCustomer } = useCustomerAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setName(customer.name ?? "");
      setPhone(customer.phone?.replace(/^\+94/, "") ?? "");
      setAddress(customer.address ?? "");
      setProvince(customer.province ?? "");
      setDistrict(customer.district ?? "");
      setCity(customer.city ?? "");
    }
  }, [customer]);

  const availableDistricts = getDistricts(province);

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setDistrict("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg("Name must be at least 2 characters.");
      return;
    }

    setSaving(true);
    try {
      const res = await customerApi.updateProfile({
        name: name.trim(),
        phone: phone ? `+94${phone}` : "",
        address: address.trim(),
        province,
        district,
        city: city.trim(),
      });
      setCustomer(res.customer);
      setSuccessMsg("Profile updated successfully.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress sx={{ color: accent }} />
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 8 }, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: { xs: "1.4rem", md: "1.8rem" } }}>
          Sign in to view your profile
        </Typography>
        <Button
          component={Link}
          href="/shop"
          variant="contained"
          sx={{ mt: 2.5, textTransform: "none", fontWeight: 700, bgcolor: accent, color: "#111111", "&:hover": { bgcolor: "#D4B060" } }}
        >
          Go to Shop
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: { xs: "1.6rem", md: "2.2rem" }, mb: 0.5 }}>
        My Profile
      </Typography>
      <Typography sx={{ color: textMuted, mb: 3, fontSize: "0.9rem" }}>
        {customer.email}
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          borderRadius: "14px",
          border: `1px solid ${border}`,
          bgcolor: cardBg,
          p: { xs: 2.4, md: 3 },
        }}
      >
        <TextField
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          sx={{ mb: 1.5 }}
        />
        <TextField
          label="Email"
          value={customer.email}
          fullWidth
          disabled
          helperText="Email cannot be changed"
          sx={{ mb: 1.5 }}
        />
        <TextField
          label="Phone Number"
          value={phone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, PHONE_MAX);
            setPhone(digits);
          }}
          fullWidth
          helperText={`Optional — ${PHONE_MAX}-digit local number`}
          InputProps={{
            startAdornment: <InputAdornment position="start">+94</InputAdornment>,
            inputProps: { maxLength: PHONE_MAX, inputMode: "numeric" },
          }}
          sx={{ mb: 1.5 }}
        />
        <TextField
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          sx={{ mb: 1.5 }}
        />
        <TextField
          select
          label="Province"
          value={province}
          onChange={(e) => handleProvinceChange(e.target.value)}
          fullWidth
          sx={{ mb: 1.5 }}
        >
          <MenuItem value="">
            <em>Select province</em>
          </MenuItem>
          {SRI_LANKA_PROVINCES.map((p) => (
            <MenuItem key={p} value={p}>{p}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="District"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          fullWidth
          disabled={!province}
          sx={{ mb: 1.5 }}
        >
          <MenuItem value="">
            <em>{province ? "Select district" : "Select province first"}</em>
          </MenuItem>
          {availableDistricts.map((d) => (
            <MenuItem key={d} value={d}>{d}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          fullWidth
          helperText="Optional — town or city name"
          sx={{ mb: 2 }}
        />

        {successMsg && <Alert severity="success" sx={{ mb: 1.5 }}>{successMsg}</Alert>}
        {errorMsg && <Alert severity="error" sx={{ mb: 1.5 }}>{errorMsg}</Alert>}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={saving}
          sx={{
            py: 1.1,
            textTransform: "none",
            fontWeight: 700,
            bgcolor: accent,
            color: "#111111",
            "&:hover": { bgcolor: "#D4B060" },
          }}
        >
          {saving ? <CircularProgress size={20} sx={{ color: "#111111" }} /> : "Save Changes"}
        </Button>
      </Box>
    </Container>
  );
}
