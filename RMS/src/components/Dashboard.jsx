import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Card,
  CardContent,
  Grid,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Chip,
  ThemeProvider,
  createTheme,
  CircularProgress,
} from "@mui/material";

// Material UI Icons
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People";
import ApartmentIcon from "@mui/icons-material/Apartment";
import HouseIcon from "@mui/icons-material/House";
import KeyIcon from "@mui/icons-material/Key";
import DescriptionIcon from "@mui/icons-material/Description";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TodayIcon from "@mui/icons-material/Today";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ErrorIcon from "@mui/icons-material/Error";

// Create custom theme with green and grey
const theme = createTheme({
  palette: {
    primary: {
      main: "#2e7d32", // Green
      light: "#60ad5e",
      dark: "#005005",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#757575", // Grey
      light: "#a4a4a4",
      dark: "#494949",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

const drawerWidth = 240;

const Dashboard = () => {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState({
    name: "",
    role: "",
    email: "",
    id: "",
  });

  // Get role from authenticated user data
  const [activeRole, setActiveRole] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [stats, setStats] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Get the authentication token
        const authToken =
          localStorage.getItem("authToken") || localStorage.getItem("token");

        if (!authToken) {
          throw new Error("No authentication token found");
        }

        // Fetch user data from API
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();

        // Set user data
        setUser({
          name: userData.name || userData.firstName + " " + userData.lastName,
          role: userData.role,
          email: userData.email,
          id: userData.id,
        });

        // Set active role
        setActiveRole(userData.role);

        // Fetch relevant data based on user role
        await fetchRoleData(userData.role);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message);
        setLoading(false);

        // Try to use stored user info as fallback
        const storedUserInfo = JSON.parse(
          localStorage.getItem("userInfo") || "{}"
        );
        if (storedUserInfo && storedUserInfo.role) {
          setUser({
            name: storedUserInfo.name || "User",
            role: storedUserInfo.role,
            email: storedUserInfo.email || "",
            id: storedUserInfo.id || "",
          });
          setActiveRole(storedUserInfo.role);
        } else {
          // If no valid user data, redirect to login
          handleLogout();
        }
      }
    };

    fetchUserData();
  }, []);

  // Fetch role-specific data
  const fetchRoleData = async (role) => {
    try {
      const authToken =
        localStorage.getItem("authToken") || localStorage.getItem("token");

      // Fetch statistics based on role
      const statsResponse = await fetch(`/api/${role}/stats`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(formatStats(statsData, role));
      } else {
        // Use placeholder stats if API fails
        setStats(getPlaceholderStats(role));
      }

      // Fetch activities based on role
      const activitiesResponse = await fetch(`/api/${role}/activities`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData);
      } else {
        // Use placeholder activities if API fails
        setActivities(getPlaceholderActivities(role));
      }

      // Fetch notifications based on role
      const notificationsResponse = await fetch(`/api/${role}/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData);
      }
    } catch (err) {
      console.error("Error fetching role data:", err);
      // Use placeholder data if API fails
      setStats(getPlaceholderStats(role));
      setActivities(getPlaceholderActivities(role));
    }
  };

  // Format API stats data to match the required structure
  const formatStats = (apiData, role) => {
    if (role === "admin") {
      return [
        {
          label: "Total Users",
          value: apiData.totalUsers || "0",
          icon: <PeopleIcon />,
        },
        {
          label: "Properties",
          value: apiData.totalProperties || "0",
          icon: <ApartmentIcon />,
        },
        {
          label: "Houses",
          value: apiData.totalHouses || "0",
          icon: <HouseIcon />,
        },
        {
          label: "Pending Bookings",
          value: apiData.pendingBookings || "0",
          icon: <KeyIcon />,
        },
      ];
    } else if (role === "landlord") {
      return [
        {
          label: "My Properties",
          value: apiData.properties || "0",
          icon: <ApartmentIcon />,
        },
        {
          label: "Total Units",
          value: apiData.units || "0",
          icon: <HouseIcon />,
        },
        {
          label: "Occupied",
          value: apiData.occupied || "0",
          icon: <KeyIcon />,
        },
        {
          label: "Monthly Revenue",
          value: `$${apiData.revenue || "0"}`,
          icon: <AttachMoneyIcon />,
        },
      ];
    } else {
      return [
        {
          label: "Current Rent",
          value: `$${apiData.rent || "0"}`,
          icon: <AttachMoneyIcon />,
        },
        {
          label: "Lease Expires",
          value: apiData.leaseExpiry || "N/A",
          icon: <DescriptionIcon />,
        },
        {
          label: "Open Tickets",
          value: apiData.openTickets || "0",
          icon: <NotificationsIcon />,
        },
        {
          label: "Next Payment",
          value: apiData.nextPayment || "N/A",
          icon: <TodayIcon />,
        },
      ];
    }
  };

  // Placeholder stats if API call fails
  const getPlaceholderStats = (role) => {
    if (role === "admin") {
      return [
        { label: "Total Users", value: "0", icon: <PeopleIcon /> },
        { label: "Properties", value: "0", icon: <ApartmentIcon /> },
        { label: "Houses", value: "0", icon: <HouseIcon /> },
        { label: "Pending Bookings", value: "0", icon: <KeyIcon /> },
      ];
    } else if (role === "landlord") {
      return [
        { label: "My Properties", value: "0", icon: <ApartmentIcon /> },
        { label: "Total Units", value: "0", icon: <HouseIcon /> },
        { label: "Occupied", value: "0", icon: <KeyIcon /> },
        { label: "Monthly Revenue", value: "$0", icon: <AttachMoneyIcon /> },
      ];
    } else {
      return [
        { label: "Current Rent", value: "$0", icon: <AttachMoneyIcon /> },
        { label: "Lease Expires", value: "N/A", icon: <DescriptionIcon /> },
        { label: "Open Tickets", value: "0", icon: <NotificationsIcon /> },
        { label: "Next Payment", value: "N/A", icon: <TodayIcon /> },
      ];
    }
  };

  // Placeholder activities if API call fails
  const getPlaceholderActivities = (role) => {
    if (role === "admin") {
      return [{ action: "No recent activities", time: "", user: "" }];
    } else if (role === "landlord") {
      return [{ action: "No recent activities", time: "", user: "" }];
    } else {
      return [{ action: "No recent activities", time: "", user: "" }];
    }
  };

  const handleLogout = () => {
    // Clear ALL relevant authentication data with matching keys to App.js
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userInfo");

    // Reset the state
    setUser({
      name: "",
      role: "",
      email: "",
      id: "",
    });
    setActiveRole("");

    // Redirect to the root path (home or login)
    navigate("/");

    // As a fallback, if navigation doesn't work
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
  };

  // Navigation items based on role
  const getNavItems = () => {
    const common = [
      { name: "Dashboard", icon: <HomeIcon />, id: "dashboard" },
      { name: "Profile", icon: <PersonIcon />, id: "profile" },
      { name: "Settings", icon: <SettingsIcon />, id: "settings" },
    ];

    if (activeRole === "admin") {
      return [
        ...common,
        { name: "Users", icon: <PeopleIcon />, id: "users" },
        { name: "Properties", icon: <ApartmentIcon />, id: "properties" },
        { name: "Houses", icon: <HouseIcon />, id: "houses" },
        { name: "Bookings", icon: <KeyIcon />, id: "bookings" },
        { name: "Invoices", icon: <DescriptionIcon />, id: "invoices" },
      ];
    } else if (activeRole === "landlord") {
      return [
        ...common,
        { name: "My Properties", icon: <ApartmentIcon />, id: "properties" },
        { name: "My Houses", icon: <HouseIcon />, id: "houses" },
        { name: "Tenants", icon: <PeopleIcon />, id: "tenants" },
        { name: "Invoices", icon: <DescriptionIcon />, id: "invoices" },
      ];
    } else {
      return [
        ...common,
        { name: "My House", icon: <HouseIcon />, id: "house" },
        { name: "Payments", icon: <AttachMoneyIcon />, id: "payments" },
        { name: "Browse Houses", icon: <ApartmentIcon />, id: "browse" },
      ];
    }
  };

  // Get action buttons based on role
  const getActionButtons = () => {
    if (activeRole === "admin") {
      return [
        {
          label: "Add New User",
          icon: <PeopleIcon />,
          action: () => navigate("/admin/users/new"),
        },
        {
          label: "Register New Property",
          icon: <ApartmentIcon />,
          action: () => navigate("/admin/properties/new"),
        },
        {
          label: "Generate Monthly Report",
          icon: <DescriptionIcon />,
          action: () => navigate("/admin/reports/generate"),
        },
      ];
    } else if (activeRole === "landlord") {
      return [
        {
          label: "Add New Property",
          icon: <ApartmentIcon />,
          action: () => navigate("/landlord/properties/new"),
        },
        {
          label: "Add New House",
          icon: <HouseIcon />,
          action: () => navigate("/landlord/houses/new"),
        },
        {
          label: "Generate Invoices",
          icon: <DescriptionIcon />,
          action: () => navigate("/landlord/invoices/generate"),
        },
      ];
    } else {
      return [
        {
          label: "Pay Rent",
          icon: <AttachMoneyIcon />,
          action: () => navigate("/tenant/payments/new"),
        },
        {
          label: "Submit Maintenance Request",
          icon: <NotificationsIcon />,
          action: () => navigate("/tenant/maintenance/new"),
        },
        {
          label: "View Lease Agreement",
          icon: <DescriptionIcon />,
          action: () => navigate("/tenant/lease"),
        },
      ];
    }
  };

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  // This function is for admin demo purposes only
  // In a production app, you would not want to allow role switching
  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    setActiveRole(newRole);

    // Update role data
    fetchRoleData(newRole);

    // This is just for demo purposes - in a real app, you would not allow role switching
    // without re-authentication or proper permissions
    localStorage.setItem("userRole", newRole);
  };

  const handleNavigation = (pageId) => {
    setActivePage(pageId);

    // Map the pageId to the correct route based on role
    const rolePrefix =
      activeRole === "landlord"
        ? "/landlord"
        : activeRole === "admin"
        ? "/admin"
        : "/tenant";

    // Handle common routes that don't have role prefixes
    if (pageId === "profile") {
      navigate("/profile");
      return;
    }
    if (pageId === "settings") {
      navigate("/settings");
      return;
    }

    // Handle role-specific routes
    switch (pageId) {
      case "dashboard":
        navigate(`${rolePrefix}/dashboard`);
        break;
      case "users":
        navigate(`${rolePrefix}/users`);
        break;
      case "properties":
        navigate(`${rolePrefix}/properties`);
        break;
      case "houses":
        navigate(`${rolePrefix}/houses`);
        break;
      case "house":
        navigate(`${rolePrefix}/house`);
        break;
      case "payments":
        navigate(`${rolePrefix}/payments`);
        break;
      case "browse":
        navigate(`${rolePrefix}/browse`);
        break;
      case "invoices":
        navigate(`${rolePrefix}/invoices`);
        break;
      case "tenants":
        navigate(`${rolePrefix}/tenants`);
        break;
      case "bookings":
        navigate(`${rolePrefix}/bookings`);
        break;
      default:
        navigate(`${rolePrefix}/dashboard`);
    }
  };

  const getPageTitle = () => {
    switch (activePage) {
      case "dashboard":
        return "Dashboard";
      case "profile":
        return "My Profile";
      case "settings":
        return "Settings";
      case "users":
        return "Users Management";
      case "properties":
        return "Properties";
      case "houses":
        return "Houses";
      case "house":
        return "My House";
      case "payments":
        return "Payments";
      case "browse":
        return "Browse Available Houses";
      case "tenants":
        return "My Tenants";
      case "bookings":
        return "Booking Requests";
      case "invoices":
        return "Invoices";
      default:
        return "Dashboard";
    }
  };

  // Handle errors or loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !user.role) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          p: 3,
        }}
      >
        <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Authentication Error
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Unable to load user data. Please log in again.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/")}
        >
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", height: "100vh" }}>
        <CssBaseline />

        {/* AppBar */}
        <AppBar
          position="fixed"
          color="default"
          elevation={0}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: "white",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="toggle drawer"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              {open ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant="h6"
                component="div"
                sx={{ color: "text.primary" }}
              >
                {getPageTitle()}
              </Typography>
              <Chip
                label={
                  activeRole === "admin"
                    ? "Admin"
                    : activeRole === "landlord"
                    ? "Landlord"
                    : "Tenant"
                }
                size="small"
                color="primary"
                sx={{ ml: 2 }}
              />
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              {/* Only show role switcher for admin demo purposes */}
              {import.meta.env.DEV && (
                <FormControl
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 120 }}
                >
                  <InputLabel id="role-select-label">View As</InputLabel>
                  <Select
                    labelId="role-select-label"
                    id="role-select"
                    value={activeRole}
                    onChange={handleRoleChange}
                    label="View As"
                  >
                    <MenuItem value="tenant">Tenant</MenuItem>
                    <MenuItem value="landlord">Landlord</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              )}
              <IconButton color="inherit">
                <Badge badgeContent={notifications.length || 0} color="primary">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  {user.name.charAt(0)}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {user.name}
                </Typography>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Drawer
          variant="persistent"
          anchor="left"
          open={open}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "primary.main",
              color: "white",
              paddingTop: "64px", // Height of AppBar
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              PropertyManager
            </Typography>
          </Box>

          <Divider sx={{ borderColor: "primary.light" }} />

          <List sx={{ py: 2 }}>
            {getNavItems().map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  selected={activePage === item.id}
                  onClick={() => handleNavigation(item.id)}
                  sx={{
                    py: 1.5,
                    borderRadius: "8px",
                    mx: 1,
                    "&.Mui-selected": {
                      backgroundColor: "primary.dark",
                    },
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: "white" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ borderColor: "primary.light", mt: "auto" }} />

          <List>
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  borderRadius: "8px",
                  mx: 1,
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "white" }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            pt: "64px", // Height of AppBar
            height: "100vh",
            overflow: "auto",
            backgroundColor: "background.default",
            p: 3,
          }}
        >
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    borderLeft: 4,
                    borderLeftColor: "primary.main",
                  }}
                >
                  <CardContent
                    sx={{ display: "flex", alignItems: "center", p: 3 }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "primary.light",
                        width: 48,
                        height: 48,
                        mr: 2,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                      <Typography
                        variant="h5"
                        component="div"
                        sx={{ fontWeight: "bold" }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Main Grid Layout */}
          <Grid container spacing={3}>
            {/* Recent Activity */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent sx={{ p: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 3,
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <Typography variant="h6" component="div">
                      Recent Activity
                    </Typography>
                    <Chip
                      label="Today"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  <Box sx={{ p: 2 }}>
                    {activities.length > 0 ? (
                      activities.map((activity, index) => (
                        <Paper
                          key={index}
                          elevation={0}
                          sx={{
                            p: 2,
                            mb: 2,
                            display: "flex",
                            alignItems: "flex-start",
                            borderRadius: 2,
                            border: "1px solid #f0f0f0",
                            "&:last-child": { mb: 0 },
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor:
                                index % 3 === 0
                                  ? "primary.light"
                                  : index % 3 === 1
                                  ? "secondary.light"
                                  : "warning.light",
                              width: 36,
                              height: 36,
                              mr: 2,
                            }}
                          >
                            {index % 3 === 0 ? (
                              <PeopleIcon />
                            ) : index % 3 === 1 ? (
                              <AttachMoneyIcon />
                            ) : (
                              <NotificationsIcon />
                            )}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="body1"
                                component="div"
                                sx={{ fontWeight: 500 }}
                              >
                                {activity.action}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {activity.time}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {activity.user}
                            </Typography>
                          </Box>
                        </Paper>
                      ))
                    ) : (
                      <Typography
                        variant="body1"
                        sx={{ textAlign: "center", py: 4 }}
                      >
                        No recent activity to display
                      </Typography>
                    )}
                  </Box>

                  {activities.length > 0 && (
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate(`/${activeRole}/activities`)}
                        sx={{
                          color: "primary.main",
                          fontWeight: 500,
                          "&:hover": {
                            backgroundColor: "transparent",
                            color: "primary.dark",
                          },
                        }}
                      >
                        View All Activity
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions and Reminders */}
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" component="div" sx={{ mb: 2 }}>
                    Quick Actions
                  </Typography>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {getActionButtons().map((action, index) => (
                      <Button
                        key={index}
                        variant="outlined"
                        color="primary"
                        startIcon={action.icon}
                        onClick={action.action}
                        sx={{
                          justifyContent: "flex-start",
                          py: 1.5,
                          borderColor: "#e0e0e0",
                          color: "text.primary",
                          backgroundColor: "#f5f5f5",
                          "&:hover": {
                            backgroundColor: "#f0f0f0",
                            borderColor: "primary.main",
                          },
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;
