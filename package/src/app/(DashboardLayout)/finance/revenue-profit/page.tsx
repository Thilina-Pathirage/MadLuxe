"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Card, CardContent, Grid, Typography, ToggleButtonGroup,
  ToggleButton, Select, MenuItem, Button, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, CircularProgress,
} from "@mui/material";
import {
  IconTrendingUp, IconShoppingCart, IconChartBar, IconPercentage,
  IconDownload, IconTruck,
} from "@tabler/icons-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import ExportSnackbar from "@/components/madlaxue/shared/ExportSnackbar";
import AppDatePicker from "@/components/madlaxue/shared/AppDatePicker";
import { api } from "@/lib/api";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatVariantLabel(label: string) {
  return (label ?? "").split("|").map((s) => s.trim()).filter(Boolean).join(" / ");
}

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <Card sx={{ borderLeft: `3px solid ${color}`, height: "100%" }}>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>{label}</Typography>
            <Typography sx={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", color: "primary.dark", lineHeight: 1 }}>
              {value}
            </Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
          <Box sx={{ width: 44, height: 44, borderRadius: "10px", bgcolor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
            <Icon size={22} stroke={1.5} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: "background.paper", p: 1.5, borderRadius: 2, boxShadow: "0 20px 40px rgba(0,28,59,0.1)", minWidth: 160 }}>
      <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5, color: "text.secondary" }}>{label}</Typography>
      {[...payload].reverse().map((p: any) => (
        <Box key={p.dataKey} sx={{ display: "flex", justifyContent: "space-between", gap: 3 }}>
          <Typography variant="caption" sx={{ color: p.fill }}>■ {p.name}</Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>Rs. {p.value.toLocaleString()}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function RevenueProfitPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const initMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [period, setPeriod]   = useState<"monthly" | "daily">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(initMonth);
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  const [summary, setSummary]   = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingBreakdown, setLoadingBreakdown] = useState(true);

  const fetchSummary = useCallback(() => {
    setLoadingSummary(true);
    const params: Record<string, string> = { period, year: String(currentYear) };
    if (period === "daily") params.month = selectedMonth;
    if (paymentFilter !== "All") params.paymentMethod = paymentFilter;
    if (fromDate) params.dateFrom = fromDate;
    if (toDate)   params.dateTo   = toDate;
    api.getFinanceSummary(params)
      .then((res: any) => setSummary(res.data ?? null))
      .catch(() => {})
      .finally(() => setLoadingSummary(false));
  }, [period, selectedMonth, paymentFilter, fromDate, toDate]);

  const fetchBreakdown = useCallback(() => {
    setLoadingBreakdown(true);
    const hasDateFilter = Boolean(fromDate || toDate);
    const params: Record<string, string> = {
      period,
      year: String(currentYear),
      limit: hasDateFilter ? "200" : "30",
    };
    if (period === "daily") params.month = selectedMonth;
    if (paymentFilter !== "All") params.paymentMethod = paymentFilter;
    if (fromDate) params.dateFrom = fromDate;
    if (toDate)   params.dateTo   = toDate;
    api.getFinanceBreakdown(params)
      .then((res: any) => setBreakdown(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingBreakdown(false));
  }, [period, selectedMonth, paymentFilter, fromDate, toDate]);

  useEffect(() => { fetchSummary(); fetchBreakdown(); }, [fetchSummary, fetchBreakdown]);

  const monthOptions = MONTHS.map((m, i) => ({
    value: `${currentYear}-${String(i + 1).padStart(2, "0")}`,
    label: `${m} ${currentYear}`,
  }));

  const kpi = summary ?? { totalRevenue: 0, totalCost: 0, grossProfit: 0, profitMargin: 0, codReceivable: 0, codOrderCount: 0 };
  const chartData = summary?.chartData ?? [];

  return (
    <PageContainer title="Revenue & Profit" description="Financial performance">
      <PageHeader title="Revenue & Profit" />

      {/* Controls */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 3, alignItems: "center" }}>
        <ToggleButtonGroup value={period} exclusive size="small"
          onChange={(_, v) => v && setPeriod(v)}>
          <ToggleButton value="monthly" sx={{ px: 2, textTransform: "none", fontWeight: 500 }}>Monthly</ToggleButton>
          <ToggleButton value="daily"   sx={{ px: 2, textTransform: "none", fontWeight: 500 }}>Daily</ToggleButton>
        </ToggleButtonGroup>
        {period === "daily" && (
          <Select value={selectedMonth} size="small" sx={{ minWidth: 130 }}
            onChange={(e) => setSelectedMonth(e.target.value)}>
            {monthOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        )}
        <Select value={paymentFilter} size="small" sx={{ minWidth: 160 }}
          inputProps={{ 'aria-label': 'Payment filter' }}
          onChange={(e) => setPaymentFilter(e.target.value)}>
          <MenuItem value="All">All Payments</MenuItem>
          <MenuItem value="COD">COD Only</MenuItem>
          <MenuItem value="BankTransfer">Bank Transfer Only</MenuItem>
        </Select>
        <AppDatePicker label="From" value={fromDate} onChange={setFromDate} sx={{ width: 160 }} />
        <AppDatePicker label="To"   value={toDate}   onChange={setToDate}   sx={{ width: 160 }} />
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: "Total Revenue", value: `Rs. ${kpi.totalRevenue.toLocaleString()}`,  icon: IconTrendingUp,   color: "#1E3A5F" },
          { label: "Total Cost",    value: `Rs. ${kpi.totalCost.toLocaleString()}`,     icon: IconShoppingCart, color: "#c62828" },
          { label: "Gross Profit",  value: `Rs. ${kpi.grossProfit.toLocaleString()}`,   icon: IconChartBar,     color: "#2e7d32" },
          { label: "Profit Margin", value: `${kpi.profitMargin}%`,                      icon: IconPercentage,   color: "#e65100" },
        ].map((c) => (
          <Grid key={c.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard {...c} />
          </Grid>
        ))}
        {(paymentFilter === "All" || paymentFilter === "COD") && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              label="COD Receivable"
              value={`Rs. ${kpi.codReceivable.toLocaleString()}`}
              sub={`${kpi.codOrderCount} COD orders`}
              icon={IconTruck}
              color="#f57c00"
            />
          </Grid>
        )}
      </Grid>

      {/* Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ color: "primary.dark", mb: 3 }}>Revenue vs Profit</Typography>
          {loadingSummary ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barGap={4} barSize={period === "monthly" ? 26 : 8}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,198,207,0.3)" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#43474e" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#43474e" }}
                  tickFormatter={(v) => `Rs. ${v}`} width={60} />
                <RTooltip content={<ChartTooltip />} cursor={{ fill: "rgba(30,58,95,0.04)" }} />
                <Bar dataKey="revenue" name="Revenue" fill="#1E3A5F" radius={[4,4,0,0]} />
                <Bar dataKey="profit"  name="Profit"  fill="#2e7d32" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <Box sx={{ display: "flex", gap: 3, justifyContent: "center", mt: 1.5 }}>
            {[{ color: "#1E3A5F", label: "Revenue" }, { color: "#2e7d32", label: "Profit" }].map((l) => (
              <Box key={l.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: l.color }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{l.label}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Breakdown table */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h5" sx={{ color: "primary.dark" }}>Breakdown</Typography>
            <Button variant="outlined" size="small" startIcon={<IconDownload size={15} />}
              onClick={() => setExportOpen(true)}>Export CSV</Button>
          </Box>
          {loadingBreakdown ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Variant</TableCell>
                    <TableCell align="center">Qty Sold</TableCell>
                    <TableCell align="right">Cost Rs.</TableCell>
                    <TableCell align="right">Revenue Rs.</TableCell>
                    <TableCell align="right">Profit Rs.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {breakdown.map((r, i) => (
                    <TableRow key={i} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(r.date).format("DD MMM YYYY")}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {formatVariantLabel(r.variantLabel)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center"><Typography variant="body2">{r.qtySold}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2">Rs. {(r.costPrice * r.qtySold).toFixed(2)}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>Rs. {r.revenue.toFixed(2)}</Typography></TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: r.profit >= 0 ? "success.main" : "error.main" }}>
                          Rs. {r.profit.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {breakdown.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5, color: "text.secondary" }}>No data for this period.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <ExportSnackbar open={exportOpen} onClose={() => setExportOpen(false)} />
    </PageContainer>
  );
}
