"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import AppDatePicker from "@/components/madlaxue/shared/AppDatePicker";
import ConfirmDialog from "@/components/madlaxue/shared/ConfirmDialog";
import { useGeneralSettings } from "@/context/GeneralSettingsContext";
import { api, ManualFinanceEntry } from "@/lib/api";
import { getCurrencyOption } from "@/lib/generalSettings";

type EntryType = "income" | "expense";

type FormState = {
  type: EntryType;
  amount: string;
  reason: string;
  entryDate: string;
};

const EMPTY_FORM: FormState = {
  type: "expense",
  amount: "",
  reason: "",
  entryDate: "",
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export default function ManualEntriesPage() {
  const { formatBusinessDate, formatCurrency, getBusinessToday, settings } = useGeneralSettings();
  const currencySymbol = getCurrencyOption(settings.currencyCode).symbol;
  const [entries, setEntries] = useState<ManualFinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [typeFilter, setTypeFilter] = useState<"All" | EntryType>("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalRows, setTotalRows] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ManualFinanceEntry | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<ManualFinanceEntry | null>(null);
  const [snackMsg, setSnackMsg] = useState("");

  const fetchEntries = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {
      page: String(page + 1),
      limit: String(rowsPerPage),
    };
    if (typeFilter !== "All") params.type = typeFilter;
    if (fromDate) params.dateFrom = fromDate;
    if (toDate) params.dateTo = toDate;

    api
      .getManualFinanceEntries(params)
      .then((res) => {
        setEntries(res.data ?? []);
        setTotalRows(res.total ?? 0);
      })
      .catch(() => {
        setEntries([]);
        setTotalRows(0);
      })
      .finally(() => setLoading(false));
  }, [fromDate, page, rowsPerPage, toDate, typeFilter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, entryDate: getBusinessToday() });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (entry: ManualFinanceEntry) => {
    setEditing(entry);
    setForm({
      type: entry.type,
      amount: String(entry.amount),
      reason: entry.reason,
      entryDate: new Date(entry.entryDate).toISOString().slice(0, 10),
    });
    setFormError("");
    setDialogOpen(true);
  };

  const validateForm = () => {
    if (!form.reason.trim()) {
      setFormError("Reason is required.");
      return false;
    }
    if (form.reason.trim().length > 200) {
      setFormError("Reason must be 200 characters or less.");
      return false;
    }

    const parsedAmount = Number(form.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError("Amount must be greater than 0.");
      return false;
    }

    if (!form.entryDate) {
      setFormError("Date is required.");
      return false;
    }

    setFormError("");
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    const payload = {
      type: form.type,
      amount: Number(form.amount),
      reason: form.reason.trim(),
      entryDate: form.entryDate,
    };

    try {
      if (editing) {
        await api.updateManualFinanceEntry(editing._id, payload);
        setSnackMsg("Manual entry updated.");
      } else {
        await api.createManualFinanceEntry(payload);
        setSnackMsg("Manual entry created.");
      }
      setDialogOpen(false);
      fetchEntries();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to save entry."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await api.deleteManualFinanceEntry(deleteTarget._id);
      setSnackMsg("Manual entry deleted.");
      setDeleteTarget(null);
      fetchEntries();
    } catch (err: unknown) {
      setSnackMsg(getErrorMessage(err, "Delete failed."));
      setDeleteTarget(null);
    }
  };

  const pageIncome = useMemo(
    () => entries.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0),
    [entries]
  );
  const pageExpense = useMemo(
    () => entries.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0),
    [entries]
  );

  return (
    <PageContainer title="Manual Entries" description="Manual income and expense tracking">
      <PageHeader
        title="Manual Entries"
        subtitle={`${totalRows} entries`}
        actions={
          <Button variant="contained" size="small" startIcon={<IconPlus size={15} />} onClick={openCreate}>
            Add Entry
          </Button>
        }
      />

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
          <Select
            size="small"
            value={typeFilter}
            sx={{ minWidth: 160 }}
            onChange={(e) => {
              setTypeFilter(e.target.value as "All" | EntryType);
              setPage(0);
            }}
          >
            <MenuItem value="All">All Types</MenuItem>
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
          </Select>

          <AppDatePicker
            label="From"
            value={fromDate}
            onChange={(v) => {
              setFromDate(v);
              setPage(0);
            }}
            sx={{ width: 170 }}
          />
          <AppDatePicker
            label="To"
            value={toDate}
            onChange={(v) => {
              setToDate(v);
              setPage(0);
            }}
            sx={{ width: 170 }}
          />

          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setTypeFilter("All");
              setFromDate("");
              setToDate("");
              setPage(0);
            }}
          >
            Reset Filters
          </Button>

          <Box sx={{ ml: "auto", display: "flex", gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: "success.main", fontWeight: 600 }}>
              Page Income: {formatCurrency(pageIncome)}
            </Typography>
            <Typography variant="caption" sx={{ color: "error.main", fontWeight: 600 }}>
              Page Expense: {formatCurrency(pageExpense)}
            </Typography>
          </Box>
        </Box>
      </Card>

      <Card>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry._id} hover>
                      <TableCell>
                        <Typography variant="body2">{formatBusinessDate(entry.entryDate)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.type === "income" ? "Income" : "Expense"}
                          color={entry.type === "income" ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {formatCurrency(entry.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 420, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {entry.reason}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {entry.createdBy?.username ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(entry)}>
                            <IconEdit size={15} stroke={1.5} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(entry)}>
                            <IconTrash size={15} stroke={1.5} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {entries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5, color: "text.secondary" }}>
                        No manual entries found for selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalRows}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{editing ? "Edit Manual Entry" : "Add Manual Entry"}</DialogTitle>
        <DialogContent sx={{ pt: "12px !important" }}>
          <Select
            fullWidth
            size="small"
            value={form.type}
            sx={{ mb: 2 }}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EntryType }))}
          >
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
          </Select>

          <TextField
            fullWidth
            size="small"
            type="number"
            label="Amount"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            sx={{ mb: 2 }}
            inputProps={{ min: 0.01, step: 0.01 }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
              },
            }}
          />

          <TextField
            fullWidth
            size="small"
            label="Reason"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            sx={{ mb: 2 }}
            multiline
            minRows={2}
            inputProps={{ maxLength: 200 }}
            helperText={`${form.reason.length}/200`}
          />

          <AppDatePicker
            label="Entry Date"
            value={form.entryDate}
            onChange={(v) => setForm((f) => ({ ...f, entryDate: v }))}
            required
          />

          {formError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" size="small" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" size="small" onClick={handleSave} disabled={saving}>
            {editing ? "Save Changes" : "Create Entry"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Entry"
        message={`Delete this ${deleteTarget?.type ?? "manual"} entry? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={!!snackMsg}
        autoHideDuration={3000}
        onClose={() => setSnackMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSnackMsg("")}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
