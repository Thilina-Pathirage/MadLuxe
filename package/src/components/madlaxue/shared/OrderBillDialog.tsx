"use client";

import { useRef, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Button, Divider, Grid, IconButton, Snackbar, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip,
  Typography, Chip,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { IconX, IconDownload, IconBrandWhatsapp, IconCopy, IconLink } from "@tabler/icons-react";
import { useGeneralSettings } from "@/context/GeneralSettingsContext";
import { OrderWithPriority } from "@/lib/api";
import { baselightTheme } from "@/utils/theme/DefaultColors";

interface Props {
  open: boolean;
  onClose: () => void;
  order: OrderWithPriority;
}

function discountLabel(type: "percent" | "fixed" | null, value: number, formatCurrency: (value: number) => string): string {
  if (!type || value === 0) return "";
  return type === "percent" ? `${value}%` : formatCurrency(value);
}

function buildWhatsAppMessage(
  order: OrderWithPriority,
  formatCurrency: (value: number) => string
): string {
  const totalItems = order.items.reduce((s, i) => s + i.qty, 0);
  const isUrgent = order.orderPriority === "Urgent" || order.orderPriority === "Top Urgent";
  const paymentLabel = order.paymentMethod === "COD" ? "COD (Cash on Delivery)" : "Bank Transfer";

  let msg = `Hi! Your order *${order.orderRef}* has been confirmed.\n\n`;
  if (isUrgent) {
    msg += `*Priority:* ${order.orderPriority}\n`;
  }
  msg += `*Items:*\n`;
  order.items.forEach((item, idx) => {
    msg += `  ${idx + 1}. ${item.variantLabel} x${item.qty} @ ${formatCurrency(item.unitPrice)}\n`;
    if (item.discountAmount > 0) {
      const dLabel = item.discountType === "percent" ? `${item.discount}%` : formatCurrency(item.discount);
      msg += `     Discount: -${formatCurrency(item.discountAmount)} (${dLabel})\n`;
    }
    msg += `     Line Total: ${formatCurrency(item.lineFinal ?? item.lineTotal)}\n`;
  });

  msg += `\n*Summary:*\n`;
  msg += `  Subtotal (${totalItems} items): ${formatCurrency(order.subtotal)}\n`;
  if ((order.itemDiscountAmount ?? 0) > 0) {
    msg += `  Item Discounts: -${formatCurrency(order.itemDiscountAmount)}\n`;
  }
  if (order.couponCode && (order.discountAmount ?? 0) > 0) {
    msg += `  Coupon (${order.couponCode}): -${formatCurrency(order.discountAmount)}\n`;
  }
  if ((order.manualDiscountAmount ?? 0) > 0) {
    const mLabel = order.manualDiscountType === "percent"
      ? `${order.manualDiscount}%`
      : formatCurrency(order.manualDiscount);
    msg += `  Manual Discount (${mLabel}): -${formatCurrency(order.manualDiscountAmount)}\n`;
  }

  msg += `\n*Order Total:* ${formatCurrency(order.total)}\n`;
  if (order.deliveryFee > 0) {
    msg += `Delivery Fee: ${formatCurrency(order.deliveryFee)}\n`;
    msg += `*Customer Pays:* ${formatCurrency(order.total + order.deliveryFee)}\n`;
  }
  msg += `*Payment:* ${paymentLabel}\n`;
  if (order.customerAddress) {
    msg += `*Address:* ${order.customerAddress}\n`;
  }
  if (order.customerSecondaryPhone) {
    msg += `*Secondary Phone:* ${order.customerSecondaryPhone}\n`;
  }
  msg += `\nThank you for your order!`;
  return msg;
}

function buildWaLink(phone: string, message: string): string {
  const stripped = phone.replace(/^\+/, "").replace(/\s/g, "");
  return `https://wa.me/${stripped}?text=${encodeURIComponent(message)}`;
}

/* ── Styled row helper for summary ── */
const SummaryRow = ({ label, value, bold, color }: {
  label: string; value: string; bold?: boolean; color?: string;
}) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.25 }}>
    <Typography variant="caption" sx={{ fontWeight: bold ? 700 : 400, color: "#757575" }}>{label}</Typography>
    <Typography variant="caption" sx={{ fontWeight: bold ? 700 : 400, color: color || "#212121" }}>{value}</Typography>
  </Box>
);

export default function OrderBillDialog({ open, onClose, order }: Props) {
  const { formatBusinessDate, formatCurrency } = useGeneralSettings();
  const billRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [snack, setSnack] = useState("");

  const waMessage = buildWhatsAppMessage(order, formatCurrency);
  const waLink = buildWaLink(order.customerPhone || "", waMessage);

  const totalItems = order.items.reduce((s, i) => s + i.qty, 0);
  const isUrgent = order.orderPriority === "Urgent" || order.orderPriority === "Top Urgent";
  const isTopUrgent = order.orderPriority === "Top Urgent";

  const handleDownload = async () => {
    if (!billRef.current) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(billRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pxW = canvas.width / 2;
      const pxH = canvas.height / 2;
      const pdf = new jsPDF({ unit: "px", format: [pxW, pxH], orientation: pxH > pxW ? "portrait" : "landscape" });
      pdf.addImage(imgData, "PNG", 0, 0, pxW, pxH);
      pdf.save(`order-${order.orderRef}.pdf`);
    } catch {
      setSnack("Failed to generate PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(waMessage);
      setSnack("Message copied to clipboard!");
    } catch {
      setSnack("Failed to copy message.");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(waLink);
      setSnack("WhatsApp link copied to clipboard!");
    } catch {
      setSnack("Failed to copy link.");
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth={false} fullWidth
        PaperProps={{ sx: { borderRadius: 2, maxWidth: 1100 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1, fontWeight: 700 }}>
          Order Bill
          <IconButton size="small" onClick={onClose}><IconX size={18} /></IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          <Grid container sx={{ minHeight: 420 }}>

            {/* ── Left: Bill Preview (forced light theme) ── */}
            <Grid size={{ xs: 12, md: 7 }}
              sx={{ borderRight: { md: "1px solid #e0e0e0" }, p: 3, bgcolor: "#fafafa" }}>
              <ThemeProvider theme={baselightTheme}>
              <Box ref={billRef} sx={{ bgcolor: "#ffffff", color: "#212121", p: 3, borderRadius: 1.5, boxShadow: 1 }}>
                {/* Header */}
                <Box sx={{ textAlign: "center", mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.dark", letterSpacing: "-0.02em" }}>
                    MADLAXUE
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#757575" }}>Order Confirmation</Typography>
                  {isUrgent && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`Priority: ${order.orderPriority}`}
                        size="small"
                        color={isTopUrgent ? "error" : "warning"}
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                  )}
                </Box>

                <Divider sx={{ mb: 2, borderColor: "#e0e0e0" }} />

                {/* Meta */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid size={6}>
                    <Typography variant="caption" sx={{ color: "#757575" }}>Order Ref</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#212121" }}>{order.orderRef}</Typography>
                  </Grid>
                  <Grid size={6} sx={{ textAlign: "right" }}>
                    <Typography variant="caption" sx={{ color: "#757575" }}>Date</Typography>
                    <Typography variant="body2" sx={{ color: "#212121" }}>{formatBusinessDate(order.createdAt)}</Typography>
                  </Grid>
                  {order.customerName && (
                    <Grid size={6}>
                      <Typography variant="caption" sx={{ color: "#757575" }}>Customer</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#212121" }}>{order.customerName}</Typography>
                    </Grid>
                  )}
                  {order.customerPhone && (
                    <Grid size={6} sx={{ textAlign: order.customerName ? "right" : "left" }}>
                      <Typography variant="caption" sx={{ color: "#757575" }}>Phone</Typography>
                      <Typography variant="body2" sx={{ color: "#212121" }}>{order.customerPhone}</Typography>
                    </Grid>
                  )}
                  {order.customerSecondaryPhone && (
                    <Grid size={6}>
                      <Typography variant="caption" sx={{ color: "#757575" }}>Secondary Phone</Typography>
                      <Typography variant="body2" sx={{ color: "#212121" }}>{order.customerSecondaryPhone}</Typography>
                    </Grid>
                  )}
                  {order.customerAddress && (
                    <Grid size={12}>
                      <Typography variant="caption" sx={{ color: "#757575" }}>Address</Typography>
                      <Typography variant="body2" sx={{ color: "#212121", whiteSpace: "pre-wrap" }}>{order.customerAddress}</Typography>
                    </Grid>
                  )}
                  <Grid size={6}>
                    <Typography variant="caption" sx={{ color: "#757575" }}>Payment</Typography>
                    <Typography variant="body2" sx={{ color: "#212121" }}>{order.paymentMethod === "COD" ? "COD" : "Bank Transfer"}</Typography>
                  </Grid>
                  <Grid size={6} sx={{ textAlign: "right" }}>
                    <Typography variant="caption" sx={{ color: "#757575" }}>Status</Typography>
                    <Box>
                      <Chip label={order.status} size="small"
                        color={order.status === "Completed" ? "success" : order.status === "Pending" ? "warning" : "error"} />
                    </Box>
                  </Grid>
                </Grid>

                {/* Items table */}
                <Table size="small" sx={{ mb: 1.5 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#424242" }}>Item</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#424242" }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#424242" }}>Unit</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#424242" }}>Discount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#424242" }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, i) => (
                      <TableRow key={i} sx={{ "&:last-child td": { border: 0 } }}>
                        <TableCell sx={{ fontSize: "0.75rem", color: "#212121" }}>{item.variantLabel}</TableCell>
                        <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#212121" }}>{item.qty}</TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.75rem", color: "#212121" }}>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.75rem" }}>
                          {item.discountAmount > 0 ? (
                            <Tooltip title={discountLabel(item.discountType, item.discount, formatCurrency)}>
                              <Typography component="span" variant="caption" sx={{ color: "#2e7d32", fontWeight: 600 }}>
                                −{formatCurrency(item.discountAmount)}
                              </Typography>
                            </Tooltip>
                          ) : (
                            <Typography component="span" variant="caption" sx={{ color: "#bdbdbd" }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#212121" }}>
                          {formatCurrency(item.lineFinal ?? item.lineTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Divider sx={{ mb: 1, borderColor: "#e0e0e0" }} />

                {/* Summary breakdown */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                  <SummaryRow label={`Subtotal (${totalItems} item${totalItems !== 1 ? "s" : ""})`} value={formatCurrency(order.subtotal)} />

                  {(order.itemDiscountAmount ?? 0) > 0 && (
                    <SummaryRow label="Item Discounts" value={`−${formatCurrency(order.itemDiscountAmount)}`} color="#2e7d32" />
                  )}

                  {order.couponCode && (order.discountAmount ?? 0) > 0 && (
                    <SummaryRow label={`Coupon (${order.couponCode})`} value={`−${formatCurrency(order.discountAmount)}`} color="#2e7d32" />
                  )}

                  {(order.manualDiscountAmount ?? 0) > 0 && (
                    <SummaryRow
                      label={`Manual Discount (${order.manualDiscountType === "percent" ? `${order.manualDiscount}%` : formatCurrency(order.manualDiscount)})`}
                      value={`−${formatCurrency(order.manualDiscountAmount)}`}
                      color="#2e7d32"
                    />
                  )}
                </Box>

                <Divider sx={{ my: 1, borderColor: "#e0e0e0" }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#212121" }}>Order Total</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.dark" }}>{formatCurrency(order.total)}</Typography>
                </Box>

                {order.deliveryFee > 0 && (
                  <>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: "#757575" }}>Delivery Fee</Typography>
                      <Typography variant="caption" sx={{ color: "#212121" }}>{formatCurrency(order.deliveryFee)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#212121" }}>Customer Pays</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#e65100" }}>
                        {formatCurrency(order.total + order.deliveryFee)}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
              </ThemeProvider>
            </Grid>

            {/* ── Right: WhatsApp ── */}
            <Grid size={{ xs: 12, md: 5 }} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "success.dark" }}>
                Share via WhatsApp
              </Typography>

              {order.customerPhone ? (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Customer: <strong>{order.customerPhone}</strong>
                  </Typography>

                  {/* Message preview */}
                  <Box sx={{
                    bgcolor: "grey.100", borderRadius: 1.5, p: 1.5, flex: 1,
                    fontSize: "0.75rem", whiteSpace: "pre-wrap", fontFamily: "monospace",
                    maxHeight: 320, overflowY: "auto", border: "1px solid", borderColor: "grey.300",
                  }}>
                    {waMessage}
                  </Box>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    <Tooltip title="Copy message text">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<IconCopy size={15} />}
                        onClick={handleCopyMessage}
                        sx={{ flex: 1, minWidth: 100 }}
                      >
                        Copy Msg
                      </Button>
                    </Tooltip>
                    <Tooltip title="Copy WhatsApp link">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<IconLink size={15} />}
                        onClick={handleCopyLink}
                        sx={{ flex: 1, minWidth: 100 }}
                      >
                        Copy Link
                      </Button>
                    </Tooltip>
                    <Tooltip title="Open WhatsApp in browser">
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        startIcon={<IconBrandWhatsapp size={15} />}
                        onClick={() => window.open(waLink, "_blank")}
                        sx={{ flex: 1, minWidth: 100 }}
                      >
                        Send
                      </Button>
                    </Tooltip>
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No phone number on this order — WhatsApp sharing unavailable.
                </Typography>
              )}
            </Grid>

          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<IconDownload size={15} />}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? "Generating…" : "Download Bill"}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" size="small" onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" variant="filled" onClose={() => setSnack("")}>{snack}</Alert>
      </Snackbar>
    </>
  );
}
