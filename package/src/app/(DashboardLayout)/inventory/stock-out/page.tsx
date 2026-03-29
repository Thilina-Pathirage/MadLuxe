"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Chip, Select,
  MenuItem, Button, Alert, Pagination, CircularProgress,
} from "@mui/material";
import { IconDownload } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import ExportSnackbar from "@/components/madlaxue/shared/ExportSnackbar";
import AppDatePicker from "@/components/madlaxue/shared/AppDatePicker";
import { useGeneralSettings } from "@/context/GeneralSettingsContext";
import { api } from "@/lib/api";

const PER_PAGE = 25;

function mvLabel(m: any) {
  if (!m?.variant) return "Unknown";
  const { category, productType, size, color } = m.variant;
  const parts = [category?.name, productType?.name];
  if (size && size !== "N/A") parts.push(size);
  parts.push(color?.name);
  return parts.filter(Boolean).join(" / ");
}

export default function StockOutPage() {
  const { formatBusinessDate } = useGeneralSettings();
  const [movements, setMovements] = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [fromDate, setFromDate]   = useState("");
  const [toDate, setToDate]       = useState("");
  const [reasonFilter, setReasonFilter] = useState("All");
  const [page, setPage]           = useState(1);
  const [exportOpen, setExportOpen] = useState(false);

  const fetchMovements = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { type: "OUT", page: String(page), limit: String(PER_PAGE) };
    if (fromDate) params.dateFrom = fromDate;
    if (toDate)   params.dateTo   = toDate;

    api.getMovements(params)
      .then((res: any) => {
        let data = res.data ?? [];
        if (reasonFilter === "Order")  data = data.filter((m: any) => !!m.orderId);
        if (reasonFilter === "Manual") data = data.filter((m: any) => !m.orderId);
        setMovements(data);
        setTotal(res.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, fromDate, toDate, reasonFilter]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  const handleFilter = (fn: () => void) => { fn(); setPage(1); };
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <PageContainer title="Stock Out" description="Stock out audit log">
      <PageHeader title="Stock Out" subtitle="Audit log of all outgoing stock" />

      <Alert severity="info" sx={{ mb: 2 }}>
        Stock out is automatically recorded when an order is confirmed. For manual stock reduction, use the{" "}
        <strong>Adjustments</strong> screen.
      </Alert>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
            <AppDatePicker label="From" value={fromDate} onChange={(v) => handleFilter(() => setFromDate(v))} sx={{ width: 160 }} />
            <AppDatePicker label="To"   value={toDate}   onChange={(v) => handleFilter(() => setToDate(v))}   sx={{ width: 160 }} />
            <Select value={reasonFilter} size="small" sx={{ minWidth: 120 }}
              onChange={(e) => handleFilter(() => setReasonFilter(e.target.value))}>
              {["All", "Order", "Manual"].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
            <Box sx={{ ml: "auto" }}>
              <Button variant="outlined" size="small" startIcon={<IconDownload size={15} />}
                onClick={() => setExportOpen(true)}>Export CSV</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Variant</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Order</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : movements.map((m) => (
                <TableRow key={m._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{formatBusinessDate(m.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{mvLabel(m)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>−{m.qty}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={m.orderId ? "Order" : "Manual"} color={m.orderId ? "primary" : "warning"} size="small" />
                  </TableCell>
                  <TableCell>
                    {m.orderId ? (
                      <Typography variant="body2" sx={{ color: "secondary.main", fontWeight: 600 }}>Order</Typography>
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && movements.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>No stock-out records match the current filters.</TableCell></TableRow>
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

      <ExportSnackbar open={exportOpen} onClose={() => setExportOpen(false)} />
    </PageContainer>
  );
}
