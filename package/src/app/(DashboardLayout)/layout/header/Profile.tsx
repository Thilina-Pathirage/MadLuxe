import React, { useState } from "react";
import {
  Avatar,
  Box,
  Menu,
  Button,
  IconButton,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import { IconSun, IconMoon, IconSettings } from "@tabler/icons-react";
import { useTheme } from "@/utils/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const { mode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();

  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="show 11 new notifications"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === "object" && {
            color: "primary.main",
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src="/images/profile/female.png"
          alt="image"
          sx={{
            width: 35,
            height: 35,
          }}
        />
      </IconButton>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "200px",
          },
        }}
      >

        <MenuItem onClick={() => { handleClose2(); router.push("/settings/general"); }}>
          <ListItemIcon>
            <IconSettings width={20} />
          </ListItemIcon>
          <ListItemText>Account Settings </ListItemText>
        </MenuItem>
        <MenuItem onClick={toggleTheme}>
          <ListItemIcon>
            {mode === "light" ? (
              <IconMoon width={20} />
            ) : (
              <IconSun width={20} />
            )}
          </ListItemIcon>
          <ListItemText>
            {mode === "light" ? "Dark Mode" : "Light Mode"}
          </ListItemText>
        </MenuItem>
        <Box mt={1} py={1} px={2}>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={() => { handleClose2(); logout(); }}
          >
            Logout
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
