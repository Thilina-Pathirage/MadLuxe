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
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { customerApi } from "@/lib/customerApi";
import { useCustomerAuth } from "@/lib/customerAuth";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

const accent = "#C9A84C";

export default function LoginDialog({ open, onClose, onSwitchToSignup }: LoginDialogProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { login } = useCustomerAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const textPrimary = isDark ? "#F0EDE8" : "#111111";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#333333", 0.68);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await customerApi.login({ email: email.trim(), password });
      login(res.token, res.customer);
      setEmail("");
      setPassword("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
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
              Welcome back
            </Typography>
            <Typography sx={{ mb: 3, color: textPrimary, fontWeight: 800, fontSize: "1.25rem", mt: 0.3 }}>
              Sign In
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
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            autoComplete="email"
            sx={{ mb: 1.5 }}
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            autoComplete="current-password"
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
            {loading ? <CircularProgress size={20} sx={{ color: "#111111" }} /> : "Sign In"}
          </Button>

          <Typography sx={{ textAlign: "center", mt: 2, color: textMuted, fontSize: "0.83rem" }}>
            Don&apos;t have an account?{" "}
            <Box
              component="span"
              onClick={() => { handleClose(); onSwitchToSignup(); }}
              sx={{ color: accent, fontWeight: 700, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
            >
              Sign up
            </Box>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
