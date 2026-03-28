"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Card, Typography, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, TableSortLabel, Chip, Select, MenuItem,
  TextField, Button, Alert, Pagination,
  CircularProgress,
} from "@mui/material";
import { IconDownload } from "@tabler/icons-react";
import dayjs from "dayjs";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import ExportSnackbar from "@/components/madlaxue/shared/ExportSnackbar";
import { api } from "@/lib/api";

const PER_PAGE = 25;

type MovementType = "IN" | "OUT" | "ADJUST";

const TYPE_COLOR: Record<MovementType, "success" | "error" | "warning"> = {
  IN: "success", OUT: "error", ADJUST: "warning",
};

function mvLabel(m: any) {
  if (!m?.variant) return "Unknown";
  const { category, productType, size, color } = m.variant;
  const parts = [category?.name, productType?.name];
  if (size && size !== "N/A") parts.push(size);
  parts.push(color?.name);
  return parts.filter(Boolean).join(" / ");
}

function qtyPrefix(m: any): string {
  if (m.type === "IN") return `+${m.qty}`;
  if (m.type === "OUT") return `−${m.qty}`;
  const delta = m.qtyAfter - m.qtyBefore;
  return delta >= 0 ? `+${Math.abs(delta)}` : `−${Math.abs(delta)}`;
}

function qtyColor(m: any): string {
  if (m.type === "IN") return "#2e7d32";
  if (m.type === "OUT") return "#c62828";
  return m.qtyAfter >= m.qtyBefore ? "#2e7d32" : "#c62828";
}

export default function StockHistoryPage() {
  const [typeFilter, setTypeFilter] = useState<"All" | MovementType>("All");
  const [fromDate, setFromDate]     = useState("");
  const [toDate, setToDate]         = useState("");
  const [sortDir, setSortDir]       = useState<"desc" | "asc">("desc");
  const [page, setPage]             = useState(1);
  const [movements, setMovements]   = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  const fetchMovements = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(PER_PAGE) };
    if (typeFilter !== "All") params.type = typeFilter;
    if (fromDate) params.dateFrom = fromDate;
    if (toDate)   params.dateTo   = toDate;

    api.getMovements(params)
      .then((res: any) => { setMovements(res.data ?? []); setTotal(res.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [typeFilter, fromDate, toDate, page]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const handleFilter = (fn: () => void) => { fn(); setPage(1); };

  return (
    <PageContainer title="Stock History" description="Immutable stock movement audit log">
      <PageHeader
        title="Stock History"
        subtitle={`${total} movements`}
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<IconDownload size={15} />}
              onClick={() => setExportOpen(true)}>Export CSV</Button>
          </Box>
        }
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        Stock history is an immutable audit log. Use the <strong>Adjustments</strong> screen to correct stock levels.
      </Alert>

      {/* Filters */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
        <Select value={typeFilter} size="small" sx={{ minWidth: 140 }}
          onChange={(e) => handleFilter(() => setTypeFilter(e.target.value as any))}>
          {(["All", "IN", "OUT", "ADJUST"] as const).map((t) =>
            <MenuItem key={t} value={t}>{t === "All" ? "All Types" : t}</MenuItem>
          )}
        </Select>
        <TextField
          size="small" label="From" type="date" value={fromDate}
          onChange={(e) => handleFilter(() => setFromDate(e.target.value))}
          sx={{ width: 160 }} slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small" label="To" type="date" value={toDate}
          onChange={(e) => handleFilter(() => setToDate(e.target.value))}
          sx={{ width: 160 }} slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sortDirection={sortDir}>
                  <TableSortLabel active direction={sortDir}
                    onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}>
                    Date &amp; Time
                  </TableSortLabel>
                </TableCell>
                <TableCell>Variant</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="center">Before</TableCell>
                <TableCell align="center">After</TableCell>
                <TableCell>Reason / Order</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : movements.map((m) => (
                <TableRow key={m._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {dayjs(m.createdAt).format("DD MMM YYYY")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {mvLabel(m)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={m.type} color={TYPE_COLOR[m.type as MovementType]} size="small"
                      sx={{ fontWeight: 700, minWidth: 60, justifyContent: "center" }} />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ fontWeight: 700, color: qtyColor(m), fontFamily: "monospace" }}>
                      {qtyPrefix(m)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">{m.qtyBefore}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.qtyAfter}</Typography>
                  </TableCell>
                  <TableCell>
                    {m.orderId ? (
                      <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600 }}>Order</Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">{m.reason || m.supplier || "—"}</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && movements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No movements match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <Pagination count={totalPages} page={page}
              onChange={(_, p) => setPage(p)} color="primary" size="small" />
          </Box>
        )}
      </Card>

      <ExportSnackbar open={exportOpen} onClose={() => setExportOpen(false)} />
    </PageContainer>
  );
}
