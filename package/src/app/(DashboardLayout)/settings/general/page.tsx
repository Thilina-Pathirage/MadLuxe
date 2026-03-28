"use client";

import { useState } from "react";
import {
  Box, Card, CardContent, Grid, Typography, TextField, Select,
  MenuItem, Button, Divider, FormControlLabel, Radio, RadioGroup,
  FormLabel, FormControl, Avatar, Snackbar, Alert, Collapse,
  InputAdornment, IconButton,
} from "@mui/material";
import { IconBuildingStore, IconEye, IconEyeOff } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: "primary.dark", mb: 2.5 }}>{title}</Typography>
        {children}
      </CardContent>
    </Card>
  );
}

export default function GeneralSettingsPage() {
  // Business info
  const [bizName, setBizName]     = useState("MADLAXUE");
  const [currency, setCurrency]   = useState("GBP (Rs.)");
  const [timezone, setTimezone]   = useState("Europe/London");

  // Stock defaults
  const [threshold, setThreshold] = useState("5");

  // Display prefs
  const [stockView, setStockView] = useState<"List" | "Grid">("List");
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  // Admin account
  const [email, setEmail] = useState("admin@madlaxue.com");
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [pwError, setPwError]     = useState("");

  const [snackMsg, setSnackMsg] = useState("");
  const [snackSev, setSnackSev] = useState<"success" | "error">("success");

  const handleSave = () => {
    // Validate password if open
    if (showPwSection) {
      if (!currentPw) { setPwError("Enter your current password."); return; }
      if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
      if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    }
    setPwError("");
    setSnackSev("success");
    setSnackMsg("Settings saved successfully.");
    setShowPwSection(false);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  return (
    <PageContainer title="General Settings" description="Business and display preferences">
      <PageHeader title="General Settings" />

      {/* Business Information */}
      <SectionCard title="Business Information">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Business Name" value={bizName} size="small" fullWidth
              onChange={(e) => setBizName(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48, fontSize: "1.2rem", fontWeight: 700 }}>
                {bizName.charAt(0)}
              </Avatar>
              <Button variant="outlined" size="small" component="label">
                Upload Logo
                <input hidden accept="image/*" type="file" />
              </Button>
              <Typography variant="caption" color="text.secondary">PNG, JPG up to 2MB</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Currency" value={currency} size="small" fullWidth
              onChange={(e) => setCurrency(e.target.value)}>
              {["GBP (Rs.)", "USD ($)", "EUR (€)", "LKR (Rs.)"].map((c) =>
                <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Timezone" value={timezone} size="small" fullWidth
              onChange={(e) => setTimezone(e.target.value)}>
              {["Asia/Colombo", "Europe/London", "America/New_York"].map((t) =>
                <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </SectionCard>

      {/* Stock Defaults */}
      <SectionCard title="Stock Defaults">
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Global Low Stock Threshold" type="number"
              value={threshold} size="small" fullWidth
              onChange={(e) => setThreshold(e.target.value)}
              inputProps={{ min: 0 }}
              helperText="Applied to all variants without a custom threshold"
            />
          </Grid>
        </Grid>
      </SectionCard>

      {/* Display Preferences */}
      <SectionCard title="Display Preferences">
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl>
              <FormLabel sx={{ fontSize: "0.8rem", fontWeight: 600, mb: 0.75 }}>Default Stock View</FormLabel>
              <RadioGroup row value={stockView} onChange={(e) => setStockView(e.target.value as any)}>
                <FormControlLabel value="List" control={<Radio size="small" />} label="List" />
                <FormControlLabel value="Grid" control={<Radio size="small" />} label="Grid" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select label="Rows Per Page" value={rowsPerPage} size="small" fullWidth
              onChange={(e) => setRowsPerPage(Number(e.target.value))}>
              {[10, 25, 50, 100].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select label="Date Format" value={dateFormat} size="small" fullWidth
              onChange={(e) => setDateFormat(e.target.value)}>
              {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((f) =>
                <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </SectionCard>

      {/* Admin Account */}
      <SectionCard title="Admin Account">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Email" value={email} size="small" fullWidth type="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>
          <Grid size={12}>
            <Button variant="outlined" size="small"
              onClick={() => { setShowPwSection((p) => !p); setPwError(""); }}>
              {showPwSection ? "Cancel Password Change" : "Change Password"}
            </Button>
          </Grid>

          <Grid size={12}>
            <Collapse in={showPwSection}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400, pt: 1 }}>
                <TextField
                  label="Current Password" size="small" fullWidth
                  type={showPw ? "text" : "password"}
                  value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                  slotProps={{ input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" edge="end" onClick={() => setShowPw((p) => !p)}>
                          {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}}
                />
                <TextField
                  label="New Password" size="small" fullWidth
                  type={showPw ? "text" : "password"}
                  value={newPw} onChange={(e) => setNewPw(e.target.value)}
                />
                <TextField
                  label="Confirm New Password" size="small" fullWidth
                  type={showPw ? "text" : "password"}
                  value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                />
                {pwError && <Alert severity="error" sx={{ py: 0.5 }}>{pwError}</Alert>}
              </Box>
            </Collapse>
          </Grid>
        </Grid>
      </SectionCard>

      {/* Save button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" size="large" onClick={handleSave} sx={{ minWidth: 160 }}>
          Save Changes
        </Button>
      </Box>

      <Snackbar open={!!snackMsg} autoHideDuration={3000} onClose={() => setSnackMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackSev} variant="filled" onClose={() => setSnackMsg("")}>{snackMsg}</Alert>
      </Snackbar>
    </PageContainer>
  );
}