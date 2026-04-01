"use client";

import { FormEvent, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { customerApi } from "@/lib/customerApi";
import { useCustomerAuth } from "@/lib/customerAuth";
import { SRI_LANKA_PROVINCES, getDistricts } from "@/lib/sriLankaGeo";

interface SignupDialogProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  /** Pre-filled values from checkout (name, phone, address) */
  prefill?: { name?: string; phone?: string; address?: string };
  /** Called after successful registration — useful for checkout flow */
  onSuccess?: (token: string) => void;
}

const accent = "#C9A84C";
const PHONE_MAX = 9;

export default function SignupDialog({ open, onClose, onSwitchToLogin, prefill, onSuccess }: SignupDialogProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { login } = useCustomerAuth();

  const [name, setName] = useState(prefill?.name ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState(prefill?.phone?.replace(/^\+94/, "") ?? "");
  const [address, setAddress] = useState(prefill?.address ?? "");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const textPrimary = isDark ? "#F0EDE8" : "#111111";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#333333", 0.68);

  const availableDistricts = getDistricts(province);

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setDistrict("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await customerApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone ? `+94${phone}` : "",
        address: address.trim(),
        province,
        district,
        city: city.trim(),
      });
      login(res.token, res.customer);
      onSuccess?.(res.token);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setEmail("");
    setPassword("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: "14px",
          bgcolor: isDark ? "#0d1410" : "#FFFFFF",
          border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.08)}`,
        },
      }}
    >
      <DialogTitle sx={{ pb: 0, pt: 2.5, px: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ color: accent, fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Create account
            </Typography>
            <Typography sx={{ mb: 3, color: textPrimary, fontWeight: 800, fontSize: "1.25rem", mt: 0.3 }}>
              Sign Up
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: textMuted }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2, pb: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            autoComplete="name"
            sx={{ mb: 1.5 }}
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            autoComplete="email"
            sx={{ mb: 1.5 }}
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            autoComplete="new-password"
            helperText="At least 6 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((v) => !v)} size="small" edge="end">
                    {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
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
            sx={{ mb: 1.5 }}
          />

          {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.1,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: accent,
              color: "#111111",
              "&:hover": { bgcolor: "#D4B060" },
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "#111111" }} /> : "Create Account"}
          </Button>

          <Typography sx={{ textAlign: "center", mt: 2, color: textMuted, fontSize: "0.83rem" }}>
            Already have an account?{" "}
            <Box
              component="span"
              onClick={() => { handleClose(); onSwitchToLogin(); }}
              sx={{ color: accent, fontWeight: 700, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
            >
              Sign in
            </Box>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
