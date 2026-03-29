"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Chip, IconButton, Button,
  Select, MenuItem, Collapse, Snackbar, Alert, Pagination, Tooltip,
  CircularProgress,
} from "@mui/material";
import { IconChevronDown, IconChevronUp, IconX, IconDownload, IconFileInvoice, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import dayjs from "dayjs";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import ImagePlaceholder from "@/components/madlaxue/shared/ImagePlaceholder";
import VariantImage from "@/components/madlaxue/shared/VariantImage";
import ConfirmDialog from "@/components/madlaxue/shared/ConfirmDialog";
import ExportSnackbar from "@/components/madlaxue/shared/ExportSnackbar";
import OrderBillDialog from "@/components/madlaxue/shared/OrderBillDialog";
import AppDatePicker from "@/components/madlaxue/shared/AppDatePicker";
import { api, Order } from "@/lib/api";
import { getPrimaryImageUrl } from "@/utils/variantImage";

const PER_PAGE = 25;

const STATUS_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  Completed: "success", Pending: "warning", Cancelled: "error", Deleted: "default",
};

export default function AllOrdersPage() {
  const [orders, setOrders]         = useState<Order[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [fromDate, setFromDate]     = useState("");
  const [toDate, setToDate]         = useState("");
  const [statusFilter, setStatus]   = useState("All");
  const [couponFilter, setCoupon]   = useState("All");
  const [paymentFilter, setPayment] = useState("All");
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [viewOrder, setViewOrder]   = useState<Order | null>(null);
  const [snackMsg, setSnackMsg]     = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [page, setPage]             = useState(1);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(PER_PAGE) };
    if (statusFilter !== "All") params.status = statusFilter;
    if (couponFilter === "Yes") params.couponApplied = "true";
    if (fromDate) params.dateFrom = fromDate;
    if (toDate)   params.dateTo   = toDate;
    if (paymentFilter !== "All") params.paymentMethod = paymentFilter;

    api.getOrders(params)
      .then((res: any) => { setOrders(res.data ?? []); setTotal(res.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter, couponFilter, paymentFilter, fromDate, toDate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const handleFilter = (fn: () => void) => { fn(); setPage(1); };

  const toggle = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleCancel = async () => {
    if (!cancelTarget) return;
    await api.cancelOrder(cancelTarget._id);
    setSnackMsg(`Order ${cancelTarget.orderRef} cancelled.`);
    setCancelTarget(null);
    fetchOrders();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.deleteOrder(deleteTarget._id);
    setSnackMsg(`Order ${deleteTarget.orderRef} deleted.`);
    setDeleteTarget(null);
    fetchOrders();
  };

  return (
    <PageContainer title="All Orders" description="Order management">
      <PageHeader
        title="All Orders"
        subtitle={`${total} orders`}
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<IconDownload size={15} />}
              onClick={() => setExportOpen(true)}>Export CSV</Button>
            <Button variant="contained" size="small" component={Link} href="/orders/new-order">
              + New Order
            </Button>
          </Box>
        }
      />

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
            <AppDatePicker label="From" value={fromDate} onChange={(v) => handleFilter(() => setFromDate(v))} sx={{ width: 160 }} />
            <AppDatePicker label="To"   value={toDate}   onChange={(v) => handleFilter(() => setToDate(v))}   sx={{ width: 160 }} />
            <Select value={statusFilter} size="small" sx={{ minWidth: 130 }}
              onChange={(e) => handleFilter(() => setStatus(e.target.value))}>
              {["All", "Completed", "Pending", "Cancelled", "Deleted"].map((s) =>
                <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
            <Select value={couponFilter} size="small" sx={{ minWidth: 150 }}
              onChange={(e) => handleFilter(() => setCoupon(e.target.value))}
              displayEmpty renderValue={(v) => v === "All" ? "Coupon: All" : `Coupon: ${v}`}>
              {["All", "Yes", "No"].map((s) => <MenuItem key={s} value={s}>{s === "All" ? "All" : `${s} coupon`}</MenuItem>)}
            </Select>
            <Select value={paymentFilter} size="small" sx={{ minWidth: 160 }}
              onChange={(e) => handleFilter(() => setPayment(e.target.value))}
              displayEmpty renderValue={(v) => v === "All" ? "Payment: All" : `Payment: ${v === "COD" ? "COD" : "Bank Transfer"}`}>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="COD">COD</MenuItem>
              <MenuItem value="BankTransfer">Bank Transfer</MenuItem>
            </Select>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40 }} />
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="center">Items</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell align="right">Discount</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6 }}><CircularProgress size={24} /></TableCell>
                </TableRow>
              ) : orders.map((o) => {
                const isOpen = expanded.has(o._id);
                const totalDiscount = (o.itemDiscountAmount ?? 0) + (o.discountAmount ?? 0) + (o.manualDiscountAmount ?? 0);
                return [
                  <TableRow key={o._id} hover sx={{ cursor: "pointer" }} onClick={() => toggle(o._id)}>
                    <TableCell sx={{ pr: 0 }}>
                      <IconButton size="small">
                        {isOpen ? <IconChevronUp size={15} /> : <IconChevronDown size={15} />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.dark" }}>{o.orderRef}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{dayjs(o.createdAt).format("DD MMM YYYY")}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{o.customerName}</Typography>
                      <Typography variant="caption" color="text.secondary">{o.customerPhone}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={o.items.length} size="small" sx={{ bgcolor: "grey.200", fontWeight: 600, minWidth: 32 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">Rs.{o.subtotal.toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      {totalDiscount > 0 ? (
                        <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
                          −Rs.{totalDiscount.toFixed(2)}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>Rs.{o.total.toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Chip
                        label={o.paymentMethod === "COD" ? "COD" : "Bank"}
                        size="small"
                        sx={{
                          bgcolor: o.paymentMethod === "COD" ? "warning.main" : "info.main",
                          color: "white",
                          fontWeight: 600,
                        }}
                      />
                      {o.deliveryFee > 0 && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          +Rs.{o.deliveryFee.toFixed(2)} delivery
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Chip label={o.status} color={STATUS_COLOR[o.status]} size="small" />
                      {o.couponCode && (
                        <Chip label={o.couponCode} size="small"
                          sx={{ ml: 0.75, bgcolor: "info.main", color: "white", fontWeight: 600, fontSize: "0.65rem" }} />
                      )}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View bill">
                        <IconButton size="small" onClick={() => setViewOrder(o)}>
                          <IconFileInvoice size={15} />
                        </IconButton>
                      </Tooltip>
                      {o.status === "Pending" && (
                        <Tooltip title="Cancel order">
                          <IconButton size="small" sx={{ color: "error.main" }} onClick={() => setCancelTarget(o)}>
                            <IconX size={15} stroke={2} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {o.status !== "Deleted" && (
                        <Tooltip title="Delete order">
                          <IconButton size="small" sx={{ color: "error.main" }} onClick={() => setDeleteTarget(o)}>
                            <IconTrash size={15} stroke={2} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>,

                  <TableRow key={`${o._id}-detail`}>
                    <TableCell colSpan={11} sx={{ p: 0, border: 0 }}>
                      <Collapse in={isOpen} unmountOnExit>
                        <Box sx={{ bgcolor: "grey.100", px: 4, py: 1.5 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {["Image", "Variant", "Qty", "Unit Price", "Cost Price", "Line Total"].map((h) => (
                                  <TableCell key={h} align={["Qty", "Unit Price", "Cost Price", "Line Total"].includes(h) ? "right" : "left"}
                                    sx={{ bgcolor: "transparent", border: 0, color: "text.secondary", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 600 }}>
                                    {h}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {o.items.map((item: any, idx: number) => {
                                const batchCost = item.batchCostPrice ?? item.costPrice;
                                const itemProfit = (item.lineFinal ?? item.lineTotal) - batchCost * item.qty;
                                const imageUrl = getPrimaryImageUrl(item.variant);
                                return (
                                <TableRow key={idx} sx={{ "&:last-child td": { border: 0 } }}>
                                  <TableCell sx={{ bgcolor: "transparent" }}>
                                    {imageUrl ? (
                                      <VariantImage
                                        src={imageUrl}
                                        alt={item.variantLabel}
                                        width={32}
                                        height={32}
                                        sx={{ width: 32, height: 32, objectFit: "cover", borderRadius: "8px" }}
                                      />
                                    ) : (
                                      <ImagePlaceholder width={32} height={32} />
                                    )}
                                  </TableCell>
                                  <TableCell sx={{ bgcolor: "transparent" }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.variantLabel}</Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ bgcolor: "transparent" }}>
                                    <Typography variant="body2">{item.qty}</Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ bgcolor: "transparent" }}>
                                    <Typography variant="body2">Rs.{item.unitPrice?.toFixed(2)}</Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ bgcolor: "transparent" }}>
                                    <Tooltip title={`Profit: Rs.${itemProfit.toFixed(2)}`}>
                                      <Typography variant="body2" color="text.secondary">
                                        Rs.{batchCost?.toFixed(2) ?? "—"}
                                      </Typography>
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell align="right" sx={{ bgcolor: "transparent" }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Rs.{(item.lineFinal ?? item.lineTotal)?.toFixed(2)}</Typography>
                                  </TableCell>
                                </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>,
                ];
              })}

              {!loading && orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No orders match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" size="small" />
          </Box>
        )}
      </Card>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel Order"
        message={`Cancel order ${cancelTarget?.orderRef} for ${cancelTarget?.customerName}? This cannot be undone.`}
        confirmLabel="Cancel Order"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Order"
        message={`Permanently delete order ${deleteTarget?.orderRef}? This will reverse all stock changes and remove it from financial reports. This cannot be undone.`}
        confirmLabel="Delete Order"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar open={!!snackMsg} autoHideDuration={3000} onClose={() => setSnackMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="info" variant="filled" onClose={() => setSnackMsg("")}>{snackMsg}</Alert>
      </Snackbar>
      <ExportSnackbar open={exportOpen} onClose={() => setExportOpen(false)} />

      {viewOrder && (
        <OrderBillDialog
          open={!!viewOrder}
          order={viewOrder}
          onClose={() => setViewOrder(null)}
        />
      )}
    </PageContainer>
  );
}
