"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box, Card, Typography, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, Chip, Button,
  Select, MenuItem, Alert, Snackbar, Tooltip, CircularProgress,
} from "@mui/material";
import { IconAlertTriangle } from "@tabler/icons-react";
import Link from "next/link";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import ImagePlaceholder from "@/components/madlaxue/shared/ImagePlaceholder";
import VariantImage from "@/components/madlaxue/shared/VariantImage";
import { api } from "@/lib/api";
import { getPrimaryImageUrl } from "@/utils/variantImage";

export default function LowStockAlertsPage() {
  const [variants, setVariants]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [catFilter, setCatFilter]   = useState("All");
  const [statusFilter, setStatus]   = useState<"All" | "Low Stock" | "Out of Stock">("All");
  const [snackMsg, setSnackMsg]     = useState("");

  useEffect(() => {
    api.getVariants({ lowStock: "true", limit: "500" })
      .then((res: any) => { setVariants(res.data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() =>
    Array.from(new Set(variants.map((v: any) => v.category?.name).filter(Boolean))),
    [variants]
  );

  const filtered = useMemo(() =>
    variants.filter((v: any) => {
      if (catFilter !== "All" && v.category?.name !== catFilter) return false;
      if (statusFilter !== "All" && v.status !== statusFilter) return false;
      return true;
    }).sort((a: any, b: any) => a.stockQty - b.stockQty),
    [variants, catFilter, statusFilter]
  );

  const lowCount = variants.filter((v: any) => v.status === "Low Stock").length;
  const outCount = variants.filter((v: any) => v.status === "Out of Stock").length;

  return (
    <PageContainer title="Low Stock Alerts" description="Variants at or below stock threshold">
      <PageHeader title="Low Stock Alerts" />

      {/* Summary chips */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "warning.main", borderRadius: 2, px: 2, py: 1 }}>
          <IconAlertTriangle size={18} style={{ color: "white" }} />
          <Typography variant="subtitle2" sx={{ color: "white", fontWeight: 600 }}>Low Stock</Typography>
          <Chip label={lowCount} size="small" sx={{ fontWeight: 700, bgcolor: "rgba(255,255,255,0.3)", color: "white" }} />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "error.main", borderRadius: 2, px: 2, py: 1 }}>
          <IconAlertTriangle size={18} style={{ color: "white" }} />
          <Typography variant="subtitle2" sx={{ color: "white", fontWeight: 600 }}>Out of Stock</Typography>
          <Chip label={outCount} size="small" sx={{ fontWeight: 700, bgcolor: "rgba(255,255,255,0.3)", color: "white" }} />
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <Select value={catFilter} size="small" sx={{ minWidth: 140 }} onChange={(e) => setCatFilter(e.target.value)}>
          <MenuItem value="All">All Categories</MenuItem>
          {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </Select>
        <Select value={statusFilter} size="small" sx={{ minWidth: 160 }} onChange={(e) => setStatus(e.target.value as any)}>
          {(["All", "Low Stock", "Out of Stock"] as const).map((s) =>
            <MenuItem key={s} value={s}>{s === "All" ? "All Statuses" : s}</MenuItem>)}
        </Select>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : variants.length === 0 ? (
        <Alert severity="success" sx={{ borderRadius: 2 }}>All variants are sufficiently stocked. Great job!</Alert>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 56 }}>Image</TableCell>
                  <TableCell>Variant</TableCell>
                  <TableCell align="center">In Stock</TableCell>
                  <TableCell align="center">Threshold</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((v: any) => (
                  <TableRow key={v._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      {getPrimaryImageUrl(v) ? (
                        <VariantImage
                          src={getPrimaryImageUrl(v)}
                          alt={v.sku}
                          width={40}
                          height={40}
                          sx={{ width: 40, height: 40, objectFit: "cover", borderRadius: "8px" }}
                        />
                      ) : (
                        <ImagePlaceholder width={40} height={40} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{v.color?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {v.category?.name} · {v.productType?.name}{v.size !== "N/A" ? ` · ${v.size}` : ""}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ display: "block", fontFamily: "monospace" }}>
                        {v.sku}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1" sx={{ fontWeight: 700, color: v.stockQty === 0 ? "error.main" : "warning.dark" }}>
                        {v.stockQty}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">{v.lowStockThreshold}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={v.status} color={v.status === "Out of Stock" ? "error" : "warning"} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Go to Stock In to restock this variant">
                        <Button variant="outlined" size="small" color="primary"
                          component={Link} href={`/inventory/stock-in?variantId=${v._id}`}
                          sx={{ whiteSpace: "nowrap" }}>
                          Quick Restock
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: "text.secondary" }}>
                      No variants match the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Snackbar open={!!snackMsg} autoHideDuration={3000} onClose={() => setSnackMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" onClose={() => setSnackMsg("")}>{snackMsg}</Alert>
      </Snackbar>
    </PageContainer>
  );
}
