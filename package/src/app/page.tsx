"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Skeleton,
  Toolbar,
  Typography,
} from "@mui/material";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";

interface Category {
  _id: string;
  name: string;
  description?: string;
}

export default function LandingPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/public/categories`)
      .then((res) => res.json())
      .then((res) => setCategories(res.data ?? []))
      .catch(() => setError("Unable to load categories"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                background: "linear-gradient(180deg, #1E3A5F 0%, #022448 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                M
              </Typography>
            </Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: "-0.02em",
                color: "text.primary",
              }}
            >
              MADLAXUE
            </Typography>
          </Box>

          <Button
            component={Link}
            href="/authentication/login"
            variant="outlined"
            color="primary"
            size="small"
          >
            Admin Login
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h2" align="center" sx={{ mb: 1, fontWeight: 700 }}>
          Our Categories
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ mb: 5 }}
        >
          Browse our product categories
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} justifyContent="center">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card>
                    <Skeleton variant="rectangular" height={220} />
                    <CardContent>
                      <Skeleton width="60%" height={32} />
                      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                        <Skeleton width={100} height={36} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            : categories.map((cat) => (
                <Grid key={cat._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box
                      sx={{
                        height: 220,
                        bgcolor: "grey.300",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Image
                      </Typography>
                    </Box>

                    <CardContent
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flexGrow: 1,
                      }}
                    >
                      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                        {cat.name}
                      </Typography>
                      <Button variant="outlined" color="primary">
                        Browse
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
        </Grid>
      </Container>
    </Box>
  );
}
