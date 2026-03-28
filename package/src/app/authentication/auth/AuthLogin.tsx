"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
} from "@mui/material";

import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";
import { useAuth } from "@/context/AuthContext";

interface loginType {
  title?: string;
  subtitle?: React.ReactNode;
  subtext?: React.ReactNode;
}

const AuthLogin = ({ title, subtitle, subtext }: loginType) => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack>
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="username"
            mb="5px"
          >
            Username
          </Typography>
          <CustomTextField
            id="username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          />
        </Box>
        <Box mt="25px">
          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="password"
            mb="5px"
          >
            Password
          </Typography>
          <CustomTextField
            id="password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") handleSubmit(); }}
          />
        </Box>
      </Stack>
      <Box mt={2}>
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </Box>
      {subtitle}
    </>
  );
};

export default AuthLogin;
