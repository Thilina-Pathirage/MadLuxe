"use client";

import { useState, useEffect } from "react";
import {
  Box, Card, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, IconButton, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Snackbar,
  Alert, Tooltip, CircularProgress,
} from "@mui/material";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import PageContainer from "@/app/portal/components/container/PageContainer";
import PageHeader from "@/components/madlaxue/shared/PageHeader";
import ConfirmDialog from "@/components/madlaxue/shared/ConfirmDialog";
import { api } from "@/lib/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<any | null>(null);
  const [name, setName]             = useState("");
  const [desc, setDesc]             = useState("");
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [snackMsg, setSnackMsg]     = useState("");
  const [snackSeverity, setSnackSev] = useState<"success" | "error">("success");

  const fetchCategories = () => {
    setLoading(true);
    api.getCategories().then((res: any) => setCategories(res.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd  = () => { setEditing(null); setName(""); setDesc(""); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setName(c.name); setDesc(c.description ?? ""); setDialogOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.updateCategory(editing._id, { name: name.trim(), description: desc });
        setSnackMsg(`Category "${name}" updated.`);
      } else {
        await api.createCategory({ name: name.trim(), description: desc });
        setSnackMsg(`Category "${name}" added.`);
      }
      setSnackSev("success");
      setDialogOpen(false);
      fetchCategories();
    } catch (err: any) {
      setSnackMsg(err.message ?? "Save failed.");
      setSnackSev("error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteCategory(deleteTarget._id);
      setSnackMsg(`Category "${deleteTarget.name}" deleted.`);
      setSnackSev("success");
    } catch (err: any) {
      setSnackMsg(err.message ?? "Delete failed.");
      setSnackSev("error");
    }
    setDeleteTarget(null);
    fetchCategories();
  };

  return (
    <PageContainer title="Categories" description="Manage product categories">
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categories`}
        actions={
          <Button variant="contained" size="small" startIcon={<IconPlus size={16} />} onClick={openAdd}>
            Add Category
          </Button>
        }
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category Name</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                      {c.description && (
                        <Typography variant="caption" color="text.secondary">{c.description}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(c)} sx={{ color: "text.secondary" }}>
                          <IconEdit size={16} stroke={1.5} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => setDeleteTarget(c)} sx={{ color: "error.main" }}>
                          <IconTrash size={16} stroke={1.5} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 6, color: "text.secondary" }}>No categories yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
        <DialogContent sx={{ pt: "12px !important" }}>
          <TextField label="Category Name" value={name} size="small" fullWidth required
            onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Description (optional)" value={desc} size="small" fullWidth multiline rows={2}
            onChange={(e) => setDesc(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" disabled={!name.trim() || saving}>
            {editing ? "Save Changes" : "Add Category"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar open={!!snackMsg} autoHideDuration={3000} onClose={() => setSnackMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackSeverity} variant="filled" onClose={() => setSnackMsg("")}>{snackMsg}</Alert>
      </Snackbar>
    </PageContainer>
  );
}
