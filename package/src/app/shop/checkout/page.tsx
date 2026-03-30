"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { publicApi, type Order, type PublicSettings } from "@/lib/api";
import { clearPublicCart, getPublicCartSubtotal, usePublicCartItems } from "@/lib/publicCart";

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
  const textPrimary = isDark ? "#F0EDE8" : "#0F1A2A";
  const textMuted = isDark ? alpha("#D8D4CC", 0.72) : alpha("#2C3A4E", 0.68);

  const cartItems = usePublicCartItems();
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BankTransfer">("COD");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);

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
  const deliveryFee = useMemo(() => {
    const fee = Number(settings?.defaultDeliveryFee ?? 0);
    return Number.isFinite(fee) && fee > 0 ? fee : 0;
  }, [settings?.defaultDeliveryFee]);
  const payableTotal = useMemo(() => total + deliveryFee, [total, deliveryFee]);

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

    if (hasError) {
      setErrorMessage("Please fix the highlighted fields.");
      return;
    }

    if (!cartItems.length) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await publicApi.createOrder({
        customerName: trimmedName,
        customerPhone: `+94${normalizedPhone}`,
        customerAddress: trimmedAddress,
        paymentMethod,
        deliveryFee,
        items: cartItems.map((item) => ({
          variantId: item.variantId,
          batchId: item.batchId,
          qty: item.qty,
        })),
      });

      setCreatedOrder(response.data);
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
            border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#0F1A2A", 0.08)}`,
            bgcolor: isDark ? alpha("#0D1825", 0.72) : "#FFFFFF",
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
            <Button component={Link} href="/shop" variant="contained" sx={{ textTransform: "none", bgcolor: accent, color: "#0F1A2A", "&:hover": { bgcolor: "#D4B060" } }}>
              Continue Shopping
            </Button>
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
        <Button component={Link} href="/shop" variant="contained" sx={{ mt: 2.2, textTransform: "none", fontWeight: 700, bgcolor: accent, color: "#0F1A2A", "&:hover": { bgcolor: "#D4B060" } }}>
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
          border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#0F1A2A", 0.08)}`,
          bgcolor: isDark ? alpha("#0D1825", 0.72) : "#FFFFFF",
        }}
      >
        <TextField
          label="Name"
          value={customerName}
          onChange={(event) => {
            const value = event.target.value;
            setCustomerName(value);
            const trimmed = value.trim();
            if (!trimmed) {
              setNameError("Name is required.");
              return;
            }
            if (trimmed.length < 2) {
              setNameError("Name must be at least 2 characters.");
              return;
            }
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

            if (!normalized) {
              setPhoneError("Phone number is required.");
              return;
            }
            if (raw && /\D/.test(raw)) {
              setPhoneError("Only numeric characters allowed.");
              return;
            }
            if (normalized.length !== PHONE_MAX_DIGITS) {
              setPhoneError(`Phone number must have ${PHONE_MAX_DIGITS} digits.`);
              return;
            }
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
            if (!trimmed) {
              setAddressError("Address is required.");
              return;
            }
            if (trimmed.length < 5) {
              setAddressError("Address must be at least 5 characters.");
              return;
            }
            setAddressError("");
          }}
          fullWidth
          multiline
          minRows={2}
          required
          error={!!addressError}
          helperText={addressError || "Required"}
          sx={{ mb: 1.8 }}
        />

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
        <Box sx={{ mb: 1.4, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Typography sx={{ color: textMuted, fontWeight: 700 }}>Payable Total</Typography>
          <Typography sx={{ color: accent, fontWeight: 800, fontSize: "1.3rem" }}>
            {formatPrice(payableTotal)}
          </Typography>
        </Box>

        {errorMessage && <Alert severity="error" sx={{ mb: 1.6 }}>{errorMessage}</Alert>}

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
            color: "#0F1A2A",
            "&:hover": { bgcolor: "#D4B060" },
          }}
        >
          {submitting ? "Placing Order..." : "Place Order"}
        </Button>
      </Box>
    </Container>
  );
}
