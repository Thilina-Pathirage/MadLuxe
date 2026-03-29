import React from "react";
import Menuitems from "./MenuItems";
import { Box, Typography, Collapse, List, ListItemButton, ListItemText } from "@mui/material";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem {
  id: string;
  title: string;
  icon?: React.ElementType;
  href?: string;
  children?: NavItem[];
}

const NavMenuItem = ({ item, pathDirect }: { item: NavItem; pathDirect: string }) => {
  const Icon = item.icon as React.ElementType;
  const isSelected = pathDirect === item.href;

  return (
    <Box px={1.5} key={item.id}>
      <ListItemButton
        component={Link}
        href={item.href!}
        selected={isSelected}
        sx={{
          borderRadius: "8px",
          py: 0.875,
          px: 1.5,
          mb: 0.25,
          gap: 1.25,
          color: isSelected ? "primary.main" : "text.secondary",
          fontWeight: isSelected ? 600 : 400,
          bgcolor: isSelected ? "primary.light" : "transparent",
          "&:hover": { bgcolor: "rgba(30,58,95,0.06)", color: "primary.dark" },
          "&.Mui-selected": { bgcolor: "primary.light", color: "primary.main" },
          "&.Mui-selected:hover": { bgcolor: "primary.light" },
        }}
      >
        {Icon && (
          <Icon stroke={1.5} size="1.2rem" style={{ flexShrink: 0 }} />
        )}
        <ListItemText
          primary={item.title}
          slotProps={{ primary: { variant: "body2", fontWeight: isSelected ? 600 : 400 } }}
        />
      </ListItemButton>
    </Box>
  );
};

const NavSubmenu = ({ item, pathDirect }: { item: NavItem; pathDirect: string }) => {
  const Icon = item.icon as React.ElementType;
  const hasActiveChild = item.children?.some((c) => c.href === pathDirect);
  const [open, setOpen] = useState(hasActiveChild ?? false);

  return (
    <Box px={1.5}>
      <ListItemButton
        onClick={() => setOpen(!open)}
        sx={{
          borderRadius: "8px",
          py: 0.875,
          px: 1.5,
          mb: 0.25,
          gap: 1.25,
          color: hasActiveChild ? "primary.main" : "text.secondary",
          "&:hover": { bgcolor: "rgba(30,58,95,0.06)", color: "primary.dark" },
        }}
      >
        {Icon && <Icon stroke={1.5} size="1.2rem" style={{ flexShrink: 0 }} />}
        <ListItemText
          primary={item.title}
          slotProps={{ primary: { variant: "body2", fontWeight: hasActiveChild ? 600 : 400 } }}
        />
        {open
          ? <IconChevronDown size="1rem" stroke={1.5} style={{ flexShrink: 0 }} />
          : <IconChevronRight size="1rem" stroke={1.5} style={{ flexShrink: 0 }} />
        }
      </ListItemButton>

      <Collapse in={open} unmountOnExit>
        <List disablePadding sx={{ pl: 1.5, mb: 0.5 }}>
          {item.children?.map((child) => {
            const isChildSelected = pathDirect === child.href;
            return (
              <ListItemButton
                key={child.id}
                component={Link}
                href={child.href!}
                selected={isChildSelected}
                sx={{
                  borderRadius: "8px",
                  py: 0.75,
                  px: 1.5,
                  mb: 0.25,
                  gap: 1,
                  color: isChildSelected ? "primary.main" : "text.secondary",
                  "&:hover": { bgcolor: "rgba(30,58,95,0.06)", color: "primary.dark" },
                  "&.Mui-selected": { bgcolor: "primary.light", color: "primary.main" },
                  "&.Mui-selected:hover": { bgcolor: "primary.light" },
                }}
              >
                <Box
                  sx={{
                    width: 5, height: 5, borderRadius: "50%",
                    bgcolor: isChildSelected ? "primary.main" : "grey.400",
                    flexShrink: 0,
                  }}
                />
                <ListItemText
                  primary={child.title}
                  slotProps={{ primary: { variant: "body2", fontWeight: isChildSelected ? 600 : 400 } }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Collapse>
    </Box>
  );
};

const SidebarItems = () => {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <Box
        component={Link}
        href="/portal"
        sx={{
          display: "flex", alignItems: "center", gap: 1.25,
          px: 3, py: 2.25, textDecoration: "none",
          borderBottom: "1px solid rgba(196,198,207,0.2)",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 34, height: 34, borderRadius: "8px",
            background: "linear-gradient(180deg, #1E3A5F 0%, #022448 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.85rem", lineHeight: 1 }}>
            M
          </Typography>
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", color: "text.primary" }}>
          MADLAXUE
        </Typography>
      </Box>

      {/* Nav items */}
      <Box
        sx={{
          flex: 1, overflowY: "auto", py: 1.5,
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": { bgcolor: "grey.300", borderRadius: "8px" },
        }}
      >
        <List disablePadding>
          {(Menuitems as NavItem[]).map((item) =>
            item.children
              ? <NavSubmenu key={item.id} item={item} pathDirect={pathname} />
              : <NavMenuItem key={item.id} item={item} pathDirect={pathname} />
          )}
        </List>
      </Box>
    </Box>
  );
};

export default SidebarItems;
