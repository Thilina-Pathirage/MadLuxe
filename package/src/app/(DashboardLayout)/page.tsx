"use client";

import { useState, useEffect } from "react";
import {
  Grid, Card, CardContent, Typography, Box, Chip,
  Table, TableBody, TableRow, TableCell, TableHead,
  ToggleButtonGroup, ToggleButton, Select, MenuItem, CircularProgress,
} from "@mui/material";
import {
  IconPackage, IconDatabase, IconTrendingUp, IconCash,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import ImagePlaceholder from "@/components/madlaxue/shared/ImagePlaceholder";
import VariantImage from "@/components/madlaxue/shared/VariantImage";
import { useGeneralSettings } from "@/context/GeneralSettingsContext";
import { api } from "@/lib/api";
import { getPrimaryImageUrl } from "@/utils/variantImage";

// ─── KPI Card ───────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  accentColor: string;
  href?: string;
}

function KpiCard({ label, value, icon: Icon, accentColor, href }: KpiCardProps) {
  const inner = (
    <Card sx={{
      height: "100%", cursor: href ? "pointer" : "default",
      transition: "transform 0.15s",
      "&:hover": href ? { transform: "translateY(-2px)" } : {},
      borderLeft: `3px solid ${accentColor}`,
    }}>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>{label}</Typography>
            <Typography sx={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", color: "primary.dark", lineHeight: 1 }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ width: 44, height: 44, borderRadius: "10px", bgcolor: `${accentColor}18`, display: "flex", alignItems: "center", justifyContent: "center", color: accentColor }}>
            <Icon size={22} stroke={1.5} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
  return href
    ? <Link href={href} style={{ textDecoration: "none", display: "block", height: "100%" }}>{inner}</Link>
    : inner;
}

function ChartTooltip({ active, payload, label, formatCurrency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: "background.paper", p: 1.5, borderRadius: 2, boxShadow: "0 20px 40px rgba(0,28,59,0.1)", minWidth: 150 }}>
      <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5, color: "text.secondary" }}>{label}</Typography>
      {payload.map((p: any) => (
        <Box key={p.dataKey} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Typography variant="caption" sx={{ color: p.fill }}>■ {p.name}</Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatCurrency(p.value)}</Typography>
        </Box>
      ))}
    </Box>
  );
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MOVEMENT_CHIP: Record<string, "success" | "error" | "warning"> = {
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

export default function Dashboard() {
  const { formatBusinessDate, formatCurrency, getBusinessMonthKey } = useGeneralSettings();
  const initMonth = getBusinessMonthKey();
  const currentYear = Number(initMonth.slice(0, 4));

  const [chartPeriod, setChartPeriod] = useState<"monthly" | "daily">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(initMonth);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    api.getDashboardStats().then((res: any) => setStats(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params: Record<string, string> = { period: chartPeriod, year: String(currentYear) };
    if (chartPeriod === "daily") params.month = selectedMonth;
    api.getFinanceSummary(params).then((res: any) => setChartData(res.data?.chartData ?? [])).catch(() => {});
  }, [chartPeriod, selectedMonth]);

  const monthOptions = MONTHS.map((m, i) => ({
    value: `${currentYear}-${String(i + 1).padStart(2, "0")}`,
    label: `${m} ${currentYear}`,
  }));

  return (
    <PageContainer title="Dashboard — MADLAXUE" description="Business overview">
      <Box>
        {/* KPI Row */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[
            { label: "Total Variants",   value: stats ? String(stats.totalVariants) : "—",                                          icon: IconPackage,       accentColor: "#1E3A5F" },
            { label: "Stock Value",      value: stats ? formatCurrency(stats.stockValue, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "—", icon: IconDatabase, accentColor: "#2E86AB" },
            { label: "Month Revenue",    value: stats ? formatCurrency(stats.todayRevenue) : "—",                                    icon: IconTrendingUp,    accentColor: "#2e7d32" },
            { label: "Month Profit",     value: stats ? formatCurrency(stats.monthlyProfit) : "—",                                   icon: IconCash,          accentColor: "#e65100" },
            { label: "Low Stock Alerts", value: stats ? String(stats.lowStockCount) : "—",                                          icon: IconAlertTriangle, accentColor: "#c62828", href: "/alerts/low-stock" },
          ].map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4, lg: "auto" }} sx={{ flexGrow: 1 }}>
              <KpiCard {...card} />
            </Grid>
          ))}
        </Grid>

        {/* Chart */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "space-between", mb: 3 }}>
              <Typography variant="h5" sx={{ color: "primary.dark" }}>Revenue vs Profit</Typography>
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
                <ToggleButtonGroup value={chartPeriod} exclusive onChange={(_, v) => v && setChartPeriod(v)} size="small">
                  <ToggleButton value="monthly" sx={{ px: 2, textTransform: "none", fontWeight: 500 }}>Monthly</ToggleButton>
                  <ToggleButton value="daily"   sx={{ px: 2, textTransform: "none", fontWeight: 500 }}>Daily</ToggleButton>
                </ToggleButtonGroup>
                {chartPeriod === "daily" && (
                  <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} size="small" sx={{ minWidth: 130 }}>
                    {monthOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </Select>
                )}
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barGap={4} barSize={chartPeriod === "monthly" ? 26 : 8}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,198,207,0.3)" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#43474e" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#43474e" }} tickFormatter={(v) => formatCurrency(v, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} width={100} />
                <Tooltip content={<ChartTooltip formatCurrency={formatCurrency} />} cursor={{ fill: "rgba(30,58,95,0.04)" }} />
                <Bar dataKey="revenue" name="Revenue" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit"  name="Profit"  fill="#2e7d32" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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

        {/* Bottom row */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ color: "primary.dark", mb: 2 }}>Recent Stock Movements</Typography>
                {!stats ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Variant</TableCell>
                        <TableCell align="center">Type</TableCell>
                        <TableCell align="right">Qty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(stats.recentMovements ?? []).map((m: any) => (
                        <TableRow key={m._id} sx={{ "&:last-child td": { border: 0 } }}>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{formatBusinessDate(m.createdAt, "DD MMM")}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {mvLabel(m)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={m.type} color={MOVEMENT_CHIP[m.type]} size="small" sx={{ minWidth: 60 }} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 700, color: m.qty < 0 ? "error.main" : "inherit" }}>
                              {m.qty > 0 ? `+${m.qty}` : m.qty}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ color: "primary.dark", mb: 2 }}>Top Selling Variants</Typography>
                {!stats ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                    {(stats.topSelling ?? []).map(({ variant, totalQtySold }: any, i: number) => (
                      <Box key={variant?._id ?? i} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.25, borderRadius: "8px", bgcolor: "grey.100" }}>
                        <Typography component="span" sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: i === 0 ? "primary.main" : "grey.300", color: i === 0 ? "#fff" : "text.secondary", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>
                          {i + 1}
                        </Typography>
                        {getPrimaryImageUrl(variant) ? (
                          <VariantImage
                            src={getPrimaryImageUrl(variant)}
                            alt={variant?.sku ?? "variant"}
                            width={36}
                            height={36}
                            sx={{ width: 36, height: 36, objectFit: "cover", borderRadius: "8px" }}
                          />
                        ) : (
                          <ImagePlaceholder width={36} height={36} />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {variant?.productType?.name} — {variant?.color?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{variant?.category?.name}</Typography>
                        </Box>
                        <Chip label={`${totalQtySold} sold`} size="small" sx={{ bgcolor: "primary.light", color: "primary.dark", fontWeight: 600 }} />
                      </Box>
                    ))}
                    {(stats.topSelling ?? []).length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                        No sales data yet.
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
