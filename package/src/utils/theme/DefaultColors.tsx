import { createTheme } from "@mui/material/styles";
import { Plus_Jakarta_Sans } from "next/font/google";

export const plus = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});

const baselightTheme = createTheme({
  direction: "ltr",
  palette: {
    primary: {
      main: "#1B4332",
      light: "#e8f5ee",
      dark: "#0a2e1a",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#2E86AB",
      light: "#e0f0f7",
      dark: "#006687",
    },
    success: {
      main: "#2e7d32",
      light: "#e8f5e9",
      dark: "#1b5e20",
      contrastText: "#ffffff",
    },
    info: {
      main: "#0277bd",
      light: "#e1f0fa",
      dark: "#01579b",
      contrastText: "#ffffff",
    },
    error: {
      main: "#c62828",
      light: "#fdecea",
      dark: "#b71c1c",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#e65100",
      light: "#fff3e0",
      dark: "#bf360c",
      contrastText: "#ffffff",
    },
    grey: {
      100: "#f7f9fb",
      200: "#f2f4f6",
      300: "#e6e8ea",
      400: "#c4c6cf",
      500: "#43474e",
      600: "#191c1e",
    },
    background: {
      default: "#f7f9fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#191c1e",
      secondary: "#43474e",
    },
    action: {
      disabledBackground: "rgba(27,67,50,0.25)",
      hoverOpacity: 0.04,
      hover: "rgba(27,67,50,0.04)",
    },
    divider: "rgba(196,198,207,0.2)",
  },
  typography: {
    fontFamily: plus.style.fontFamily,
    h1: {
      fontWeight: 700,
      fontSize: "2.25rem",
      lineHeight: "2.75rem",
      letterSpacing: "-0.02em",
      fontFamily: plus.style.fontFamily,
      color: "#0a2e1a",
    },
    h2: {
      fontWeight: 700,
      fontSize: "1.875rem",
      lineHeight: "2.25rem",
      letterSpacing: "-0.02em",
      fontFamily: plus.style.fontFamily,
      color: "#0a2e1a",
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: "1.75rem",
      letterSpacing: "-0.01em",
      fontFamily: plus.style.fontFamily,
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.3125rem",
      lineHeight: "1.6rem",
      letterSpacing: "-0.01em",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.125rem",
      lineHeight: "1.6rem",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: "1.2rem",
    },
    button: {
      textTransform: "capitalize",
      fontWeight: 500,
    },
    body1: {
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: "1.5rem",
    },
    body2: {
      fontSize: "0.75rem",
      letterSpacing: "0rem",
      fontWeight: 400,
      lineHeight: "1.25rem",
    },
    subtitle1: {
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: "0.75rem",
      fontWeight: 500,
      color: "#43474e",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f7f9fb",
        },
        ".MuiPaper-elevation9, .MuiPopover-root .MuiPaper-elevation": {
          boxShadow:
            "0 20px 40px rgba(0, 28, 59, 0.06) !important",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 20px 40px rgba(0, 28, 59, 0.06)",
          border: "1px solid rgba(196, 198, 207, 0.2)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          fontWeight: 500,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
          "&.Mui-disabled": {
            color: "#c4c6cf",
          },
        },
        contained: {
          color: "#ffffff !important",
        },
        containedPrimary: {
          background: "linear-gradient(180deg, #1B4332 0%, #0a2e1a 100%)",
          "&:hover": {
            background: "linear-gradient(180deg, #1f4d3a 0%, #0f3522 100%)",
          },
          "&.Mui-disabled": {
            background: "#f2f4f6",
          },
        },
        containedSecondary: {
          "&.Mui-disabled": {
            backgroundColor: "#f2f4f6",
          },
        },
        containedError: {
          "&.Mui-disabled": {
            backgroundColor: "#f2f4f6",
          },
        },
        containedWarning: {
          "&.Mui-disabled": {
            backgroundColor: "#f2f4f6",
          },
        },
        containedSuccess: {
          "&.Mui-disabled": {
            backgroundColor: "#f2f4f6",
          },
        },
        outlinedPrimary: {
          "&.Mui-disabled": {
            backgroundColor: "#f2f4f6",
            borderColor: "#e6e8ea",
          },
        },
        outlinedSecondary: {
          "&.Mui-disabled": {
            backgroundColor: "#f2f4f6",
            borderColor: "#e6e8ea",
          },
        },
        outlinedError: {
          "&.Mui-disabled": {
            backgroundColor: "#f2f4f6",
            borderColor: "#e6e8ea",
          },
        },
        outlinedWarning: {
          "&.Mui-disabled": {
            backgroundColor: "#f2f4f6",
            borderColor: "#e6e8ea",
          },
        },
        outlinedSuccess: {
          "&.Mui-disabled": {
            backgroundColor: "#f2f4f6",
            borderColor: "#e6e8ea",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "6px",
            backgroundColor: "#ffffff",
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#2E86AB",
              borderWidth: "2px",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          fontWeight: 500,
          fontSize: "0.75rem",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#43474e",
          backgroundColor: "#f2f4f6",
          borderBottom: "1px solid rgba(196,198,207,0.4)",
        },
        root: {
          borderBottom: "1px solid rgba(196,198,207,0.2)",
          padding: "12px 16px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

const basedarkTheme = createTheme({
  direction: "ltr",
  palette: {
    mode: "dark",
    primary: {
      main: "#40916c",
      light: "#1b4332",
      dark: "#2d6a4f",
    },
    secondary: {
      main: "#81C784",
      light: "#2d6a4f",
      dark: "#4CAF50",
    },
    success: {
      main: "#66BB6A",
      light: "#2e7d32",
      dark: "#2E7D32",
      contrastText: "#ffffff",
    },
    info: {
      main: "#42A5F5",
      light: "#0277bd",
      dark: "#1976D2",
      contrastText: "#ffffff",
    },
    error: {
      main: "#EF5350",
      light: "#c62828",
      dark: "#D32F2F",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#FFA726",
      light: "#e65100",
      dark: "#F57C00",
      contrastText: "#ffffff",
    },
    grey: {
      100: "#0a0f0b",
      200: "#141a15",
      300: "#1e261f",
      400: "#384039",
      500: "#bdbdbd",
      600: "#e0e0e0",
    },
    background: {
      default: "#080d09",
      paper: "#0d1410",
    },
    text: {
      primary: "#ffffff",
      secondary: "#a0b5a8",
    },
    action: {
      disabledBackground: "rgba(64,145,108,0.12)",
      hoverOpacity: 0.08,
      hover: "rgba(64,145,108,0.08)",
    },
    divider: "rgba(64,145,108,0.12)",
  },
  typography: {
    fontFamily: plus.style.fontFamily,
    h1: {
      fontWeight: 700,
      fontSize: "2.25rem",
      lineHeight: "2.75rem",
      letterSpacing: "-0.02em",
      fontFamily: plus.style.fontFamily,
      color: "#ffffff",
    },
    h2: {
      fontWeight: 700,
      fontSize: "1.875rem",
      lineHeight: "2.25rem",
      letterSpacing: "-0.02em",
      fontFamily: plus.style.fontFamily,
      color: "#ffffff",
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: "1.75rem",
      letterSpacing: "-0.01em",
      fontFamily: plus.style.fontFamily,
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.3125rem",
      lineHeight: "1.6rem",
      letterSpacing: "-0.01em",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.125rem",
      lineHeight: "1.6rem",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: "1.2rem",
    },
    button: {
      textTransform: "capitalize",
      fontWeight: 500,
    },
    body1: {
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: "1.5rem",
    },
    body2: {
      fontSize: "0.75rem",
      letterSpacing: "0rem",
      fontWeight: 400,
      lineHeight: "1.25rem",
    },
    subtitle1: {
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: "0.75rem",
      fontWeight: 500,
      color: "#b0bec5",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#080d09",
        },
        ".MuiPaper-elevation9, .MuiPopover-root .MuiPaper-elevation": {
          boxShadow:
            "0 20px 40px rgba(0, 0, 0, 0.3) !important",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(64,145,108,0.12)",
          backgroundColor: "#0d1410",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          fontWeight: 500,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
          "&.Mui-disabled": {
            color: "#616161",
          },
        },
        containedPrimary: {
          background: "linear-gradient(180deg, #40916c 0%, #2d6a4f 100%)",
          "&:hover": {
            background: "linear-gradient(180deg, #52b788 0%, #40916c 100%)",
          },
          "&.Mui-disabled": {
            background: "#141a15",
          },
        },
        containedSecondary: {
          "&.Mui-disabled": {
            backgroundColor: "#141a15",
          },
        },
        containedError: {
          "&.Mui-disabled": {
            backgroundColor: "#141a15",
          },
        },
        containedWarning: {
          "&.Mui-disabled": {
            backgroundColor: "#141a15",
          },
        },
        containedSuccess: {
          "&.Mui-disabled": {
            backgroundColor: "#141a15",
          },
        },
        outlinedPrimary: {
          "&.Mui-disabled": {
            backgroundColor: "#141a15",
            borderColor: "#1e261f",
          },
        },
        outlinedSecondary: {
          "&.Mui-disabled": {
            backgroundColor: "#141a15",
            borderColor: "#1e261f",
          },
        },
        outlinedError: {
          "&.Mui-disabled": {
            backgroundColor: "#141a15",
            borderColor: "#1e261f",
          },
        },
        outlinedWarning: {
          "&.Mui-disabled": {
            backgroundColor: "#141a15",
            borderColor: "#1e261f",
          },
        },
        outlinedSuccess: {
          "&.Mui-disabled": {
            backgroundColor: "#141a15",
            borderColor: "#1e261f",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "6px",
            backgroundColor: "#141a15",
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#40916c",
              borderWidth: "2px",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          fontWeight: 500,
          fontSize: "0.75rem",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#b0bec5",
          backgroundColor: "#141a15",
          borderBottom: "1px solid rgba(100,181,246,0.12)",
        },
        root: {
          borderBottom: "1px solid rgba(100,181,246,0.12)",
          padding: "12px 16px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

export { baselightTheme, basedarkTheme };
