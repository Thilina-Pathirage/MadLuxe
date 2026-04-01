"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { IconButton } from "@mui/material";
import { publicApi, type Order, type PublicSettings } from "@/lib/api";
import { clearPublicCart, getPublicCartSubtotal, usePublicCartItems } from "@/lib/publicCart";
import { useCustomerAuth, setCustomerToken } from "@/lib/customerAuth";
import { SRI_LANKA_PROVINCES, getDistricts } from "@/lib/sriLankaGeo";
import { MenuItem } from "@mui/material";

const CURRENCY_SYMBOLS: Record<string, string> = {
  LKR: "Rs.",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
};
const PHONE_MAX_DIGITS = 9;

export default function ShopCheckoutPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = "#C9A84C";
  const textPrimary = isDark ? "#F0EDE8" : "#111111";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#333333", 0.68);

  const cartItems = usePublicCartItems();
  const { customer, login: loginCustomer } = useCustomerAuth();

  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerProvince, setCustomerProvince] = useState("");
  const [customerDistrict, setCustomerDistrict] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BankTransfer">("COD");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [totalWeightGrams, setTotalWeightGrams] = useState(0);
  const [deliveryQuoteError, setDeliveryQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);

  const availableDistricts = getDistricts(customerProvince);

  const handleProvinceChange = (value: string) => {
    setCustomerProvince(value);
    setCustomerDistrict("");
  };

  // Create-account fields (shown to guests only)
  const [createAccount, setCreateAccount] = useState(true);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountEmailError, setAccountEmailError] = useState("");
  const [accountPasswordError, setAccountPasswordError] = useState("");

  // Pre-fill fields from customer profile if logged in
  useEffect(() => {
    if (customer) {
      setCustomerName(customer.name ?? "");
      setCustomerPhone(customer.phone?.replace(/^\+94/, "") ?? "");
      setCustomerAddress(customer.address ?? "");
      setCustomerProvince(customer.province ?? "");
      setCustomerDistrict(customer.district ?? "");
      setCustomerCity(customer.city ?? "");
    }
  }, [customer]);

  useEffect(() => {
    publicApi.getSettings().then((res) => setSettings(res.data)).catch(() => {});
  }, []);

  const formatPrice = useCallback(
    (value: number) => {
      const symbol = CURRENCY_SYMBOLS[settings?.currencyCode ?? "LKR"] ?? "Rs.";
      return `${symbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [settings],
  );

  const total = useMemo(() => getPublicCartSubtotal(cartItems), [cartItems]);
  const payableTotal = useMemo(() => total + deliveryFee, [total, deliveryFee]);

  useEffect(() => {
    if (!cartItems.length || !customerProvince) {
      setDeliveryFee(0);
      setTotalWeightGrams(0);
      setDeliveryQuoteError(null);
      return;
    }

    let cancelled = false;
    publicApi
      .quoteDelivery({
        customerProvince,
        items: cartItems.map((item) => ({ variantId: item.variantId, qty: item.qty })),
      })
      .then((res) => {
        if (cancelled) return;
        setDeliveryFee(Math.max(0, Number(res.data.deliveryFee || 0)));
        setTotalWeightGrams(Math.max(0, Math.round(Number(res.data.totalWeightGrams || 0))));
        setDeliveryQuoteError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setDeliveryFee(0);
        setTotalWeightGrams(0);
        setDeliveryQuoteError(err instanceof Error ? err.message : "Unable to calculate delivery fee.");
      });

    return () => {
      cancelled = true;
    };
  }, [cartItems, customerProvince]);

  const sellerWhatsapp = String(settings?.sellerWhatsappPhone || "").trim();
  const sanitizedSellerPhone = sellerWhatsapp.replace(/[^\d]/g, "");

  const whatsappMessage = useMemo(() => {
    if (!createdOrder) return "";
    return [
      "Hello, I placed an order and selected Bank Transfer.",
      `Order Number: ${createdOrder.orderRef}`,
      `Customer Name: ${createdOrder.customerName}`,
      `Customer Phone: ${createdOrder.customerPhone}`,
      `Customer Address: ${createdOrder.customerAddress}`,
    ].join("\n");
  }, [createdOrder]);

  const whatsappLink = useMemo(() => {
    if (!sanitizedSellerPhone || !whatsappMessage) return "";
    return `https://wa.me/${sanitizedSellerPhone}?text=${encodeURIComponent(whatsappMessage)}`;
  }, [sanitizedSellerPhone, whatsappMessage]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    let hasError = false;
    const trimmedName = customerName.trim();
    const trimmedAddress = customerAddress.trim();
    const normalizedPhone = customerPhone.trim();

    if (!trimmedName) {
      setNameError("Name is required.");
      hasError = true;
    } else if (trimmedName.length < 2) {
      setNameError("Name must be at least 2 characters.");
      hasError = true;
    } else {
      setNameError("");
    }

    if (!normalizedPhone) {
      setPhoneError("Phone number is required.");
      hasError = true;
    } else if (normalizedPhone.length !== PHONE_MAX_DIGITS) {
      setPhoneError(`Phone number must have ${PHONE_MAX_DIGITS} digits.`);
      hasError = true;
    } else {
      setPhoneError("");
    }

    if (!trimmedAddress) {
      setAddressError("Address is required.");
      hasError = true;
    } else if (trimmedAddress.length < 5) {
      setAddressError("Address must be at least 5 characters.");
      hasError = true;
    } else {
      setAddressError("");
    }

    // Validate account fields if guest and checkbox checked
    if (!customer && createAccount) {
      if (!accountEmail.trim()) {
        setAccountEmailError("Email is required.");
        hasError = true;
      } else if (!/^\S+@\S+\.\S+$/.test(accountEmail.trim())) {
        setAccountEmailError("Enter a valid email address.");
        hasError = true;
      } else {
        setAccountEmailError("");
      }
      if (!accountPassword || accountPassword.length < 6) {
        setAccountPasswordError("Password must be at least 6 characters.");
        hasError = true;
      } else {
        setAccountPasswordError("");
      }
    }

    if (hasError) {
      setErrorMessage("Please fix the highlighted fields.");
      return;
    }

    if (!cartItems.length) {
      setErrorMessage("Your cart is empty.");
      return;
    }
    if (!customerProvince) {
      setErrorMessage("Please select your province to calculate delivery.");
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";
      const token = typeof window !== "undefined" ? localStorage.getItem("madlaxue_customer_token") : null;

      const body: Record<string, unknown> = {
        customerName: trimmedName,
        customerPhone: `+94${normalizedPhone}`,
        customerAddress: trimmedAddress,
        customerProvince: customerProvince,
        customerDistrict: customerDistrict,
        customerCity: customerCity.trim(),
        paymentMethod,
        items: cartItems.map((item) => ({
          variantId: item.variantId,
          batchId: item.batchId,
          qty: item.qty,
        })),
      };

      if (!customer && createAccount && accountEmail.trim() && accountPassword.length >= 6) {
        body.createAccount = {
          email: accountEmail.trim(),
          password: accountPassword,
        };
      }

      const res = await fetch(`${baseUrl}/public/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Unable to place order.");
      }

      // Store new customer token if account was created
      if (json.customerToken) {
        setCustomerToken(json.customerToken);
        // Refresh customer context — re-fetch profile
        const meRes = await fetch(`${baseUrl}/public/customer/me`, {
          headers: { Authorization: `Bearer ${json.customerToken}` },
        });
        if (meRes.ok) {
          const meJson = await meRes.json();
          if (meJson.success && meJson.customer) {
            loginCustomer(json.customerToken, meJson.customer);
          }
        }
      }

      setCreatedOrder(json.data);
      clearPublicCart();

      if (paymentMethod === "BankTransfer") {
        setBankDialogOpen(true);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (createdOrder) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 7 } }}>
        <Box
          sx={{
            borderRadius: "14px",
            p: { xs: 2.4, md: 3 },
            border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.08)}`,
            bgcolor: isDark ? alpha("#0d1410", 0.72) : "#FFFFFF",
          }}
        >
          <Typography sx={{ color: accent, fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Order Placed
          </Typography>
          <Typography sx={{ color: textPrimary, fontWeight: 800, fontSize: { xs: "1.5rem", md: "2rem" }, mt: 1 }}>
            {createdOrder.orderRef}
          </Typography>
          <Typography sx={{ color: textMuted, mt: 0.8 }}>
            Your order is now pending confirmation.
          </Typography>

          <Box sx={{ mt: 2.2 }}>
            <Typography sx={{ color: textMuted, fontSize: "0.84rem" }}>Total</Typography>
            <Typography sx={{ color: accent, fontWeight: 800, fontSize: "1.25rem" }}>
              {formatPrice(createdOrder.total)}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2.6 }}>
            <Button component={Link} href="/shop" variant="contained" sx={{ textTransform: "none", bgcolor: accent, color: "#111111", "&:hover": { bgcolor: "#D4B060" } }}>
              Continue Shopping
            </Button>
            {customer && (
              <Button component={Link} href="/shop/orders" variant="outlined" sx={{ textTransform: "none", borderColor: alpha(accent, 0.65), color: accent }}>
                View My Orders
              </Button>
            )}
            {createdOrder.paymentMethod === "BankTransfer" && (
              <Button variant="outlined" onClick={() => setBankDialogOpen(true)} sx={{ textTransform: "none", borderColor: alpha(accent, 0.65), color: accent }}>
                Open Bank Transfer Details
              </Button>
            )}
          </Box>
        </Box>

        <Dialog open={bankDialogOpen} onClose={() => setBankDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Bank Transfer Confirmation</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 1.2 }}>
              Contact the seller on WhatsApp and share your transfer confirmation.
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.86rem" }}>
              Seller WhatsApp: {sellerWhatsapp || "Not configured"}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setBankDialogOpen(false)}>Close</Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<WhatsAppIcon />}
              disabled={!whatsappLink}
              onClick={() => window.open(whatsappLink, "_blank", "noopener,noreferrer")}
            >
              Open in WhatsApp
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  if (!cartItems.length) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: { xs: "1.6rem", md: "2rem" } }}>
          Your cart is empty
        </Typography>
        <Typography sx={{ mt: 1, color: textMuted }}>
          Add products before checkout.
        </Typography>
        <Button component={Link} href="/shop" variant="contained" sx={{ mt: 2.2, textTransform: "none", fontWeight: 700, bgcolor: accent, color: "#111111", "&:hover": { bgcolor: "#D4B060" } }}>
          Go to Shop
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography sx={{ fontWeight: 800, color: textPrimary, fontSize: { xs: "1.6rem", md: "2.2rem" }, mb: 2.4 }}>
        Checkout
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          borderRadius: "14px",
          p: { xs: 2.4, md: 3 },
          border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#111111", 0.08)}`,
          bgcolor: isDark ? alpha("#0d1410", 0.72) : "#FFFFFF",
        }}
      >
        {/* Logged-in indicator */}
        {customer && (
          <Box sx={{ mb: 2, px: 1.5, py: 1, borderRadius: "8px", bgcolor: isDark ? alpha("#C9A84C", 0.08) : alpha("#C9A84C", 0.06) }}>
            <Typography sx={{ color: textMuted, fontSize: "0.82rem" }}>
              Ordering as{" "}
              <Box component="span" sx={{ fontWeight: 700, color: textPrimary }}>{customer.name}</Box>
              {" "}— this order will be linked to your account.
            </Typography>
          </Box>
        )}

        <TextField
          label="Name"
          value={customerName}
          onChange={(event) => {
            const value = event.target.value;
            setCustomerName(value);
            const trimmed = value.trim();
            if (!trimmed) { setNameError("Name is required."); return; }
            if (trimmed.length < 2) { setNameError("Name must be at least 2 characters."); return; }
            setNameError("");
          }}
          fullWidth
          required
          error={!!nameError}
          helperText={nameError || "Required"}
          sx={{ mb: 1.5 }}
        />
        <TextField
          label="Phone Number"
          value={customerPhone}
          onChange={(event) => {
            const raw = event.target.value;
            const digitsOnly = raw.replace(/\D/g, "");
            const normalized = digitsOnly.slice(0, PHONE_MAX_DIGITS);
            setCustomerPhone(normalized);
            if (!normalized) { setPhoneError("Phone number is required."); return; }
            if (raw && /\D/.test(raw)) { setPhoneError("Only numeric characters allowed."); return; }
            if (normalized.length !== PHONE_MAX_DIGITS) { setPhoneError(`Phone number must have ${PHONE_MAX_DIGITS} digits.`); return; }
            setPhoneError("");
          }}
          fullWidth
          required
          error={!!phoneError}
          helperText={phoneError || `Enter ${PHONE_MAX_DIGITS}-digit local number`}
          InputProps={{
            startAdornment: <InputAdornment position="start">+94</InputAdornment>,
            inputProps: { maxLength: PHONE_MAX_DIGITS, inputMode: "numeric" },
          }}
          sx={{ mb: 1.5 }}
        />
        <TextField
          label="Address"
          value={customerAddress}
          onChange={(event) => {
            const value = event.target.value;
            setCustomerAddress(value);
            const trimmed = value.trim();
            if (!trimmed) { setAddressError("Address is required."); return; }
            if (trimmed.length < 5) { setAddressError("Address must be at least 5 characters."); return; }
            setAddressError("");
          }}
          fullWidth
          multiline
          minRows={2}
          required
          error={!!addressError}
          helperText={addressError || "Required"}
          sx={{ mb: 1.5 }}
        />
        <TextField
          select
          label="Province"
          value={customerProvince}
          onChange={(e) => handleProvinceChange(e.target.value)}
          fullWidth
          required
          sx={{ mb: 1.5 }}
        >
          <MenuItem value=""><em>Select province</em></MenuItem>
          {SRI_LANKA_PROVINCES.map((p) => (
            <MenuItem key={p} value={p}>{p}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="District"
          value={customerDistrict}
          onChange={(e) => setCustomerDistrict(e.target.value)}
          fullWidth
          disabled={!customerProvince}
          sx={{ mb: 1.5 }}
        >
          <MenuItem value=""><em>{customerProvince ? "Select district" : "Select province first"}</em></MenuItem>
          {availableDistricts.map((d) => (
            <MenuItem key={d} value={d}>{d}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="City"
          value={customerCity}
          onChange={(e) => setCustomerCity(e.target.value)}
          fullWidth
          helperText="Optional — town or city name"
          sx={{ mb: 1.8 }}
        />

        {/* Create account section — guests only */}
        {!customer && (
          <Box sx={{ mb: 1.8 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  sx={{ color: accent, "&.Mui-checked": { color: accent } }}
                />
              }
              label={
                <Typography sx={{ color: textPrimary, fontSize: "0.88rem", fontWeight: 600 }}>
                  Create an account to track your orders
                </Typography>
              }
            />

            {createAccount && (
              <Box sx={{ mt: 1.2, pl: 0.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={accountEmail}
                  onChange={(e) => {
                    setAccountEmail(e.target.value);
                    setAccountEmailError("");
                  }}
                  fullWidth
                  required
                  error={!!accountEmailError}
                  helperText={accountEmailError || "Used to sign in later"}
                  autoComplete="email"
                />
                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={accountPassword}
                  onChange={(e) => {
                    setAccountPassword(e.target.value);
                    setAccountPasswordError("");
                  }}
                  fullWidth
                  required
                  error={!!accountPasswordError}
                  helperText={accountPasswordError || "At least 6 characters"}
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((v) => !v)} size="small" edge="end">
                          {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            )}
          </Box>
        )}

        <Typography sx={{ color: textMuted, fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", mb: 0.8 }}>
          Payment Method
        </Typography>
        <RadioGroup
          row
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value as "COD" | "BankTransfer")}
          sx={{ mb: 1.8 }}
        >
          <FormControlLabel value="COD" control={<Radio />} label="COD" />
          <FormControlLabel value="BankTransfer" control={<Radio />} label="Bank Transfer" />
        </RadioGroup>

        <Box sx={{ mt: 1.2, mb: 0.8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Typography sx={{ color: textMuted, fontWeight: 600 }}>Items Total</Typography>
          <Typography sx={{ color: textPrimary, fontWeight: 700, fontSize: "1rem" }}>
            {formatPrice(total)}
          </Typography>
        </Box>
        <Box sx={{ mb: 1.4, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Typography sx={{ color: textMuted, fontWeight: 600 }}>Delivery Charges</Typography>
          <Typography sx={{ color: textPrimary, fontWeight: 700, fontSize: "1rem" }}>
            {formatPrice(deliveryFee)}
          </Typography>
        </Box>
        <Typography sx={{ color: textMuted, fontSize: "0.78rem", mb: 0.6 }}>
          Delivery fee is calculating according to your order approximate weight and delivery location.
        </Typography>
        <Box sx={{ mb: 1.2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Typography sx={{ color: textMuted, fontWeight: 600 }}>Order Total Weight</Typography>
          <Typography sx={{ color: textPrimary, fontWeight: 700, fontSize: "0.92rem" }}>
            {(totalWeightGrams / 1000).toFixed(2)} kg
          </Typography>
        </Box>
        <Box sx={{ mb: 1.4, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Typography sx={{ color: textMuted, fontWeight: 700 }}>Payable Total</Typography>
          <Typography sx={{ color: accent, fontWeight: 800, fontSize: "1.3rem" }}>
            {formatPrice(payableTotal)}
          </Typography>
        </Box>

        {errorMessage && <Alert severity="error" sx={{ mb: 1.6 }}>{errorMessage}</Alert>}
        {deliveryQuoteError && <Alert severity="warning" sx={{ mb: 1.6 }}>{deliveryQuoteError}</Alert>}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={submitting}
          sx={{
            mt: 0.4,
            textTransform: "none",
            fontWeight: 700,
            py: 1.1,
            bgcolor: accent,
            color: "#111111",
            "&:hover": { bgcolor: "#D4B060" },
          }}
        >
          {submitting ? "Placing Order..." : "Place Order"}
        </Button>
      </Box>
    </Container>
  );
}
