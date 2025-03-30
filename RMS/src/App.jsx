import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import PaymentIcon from '@mui/icons-material/Payment';
import HouseIcon from '@mui/icons-material/House';
import SearchIcon from '@mui/icons-material/Search';
import BookIcon from '@mui/icons-material/Book';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LogoutIcon from '@mui/icons-material/Logout';

// Import configuration
import { STORAGE_KEYS, APP_SETTINGS } from '../src/components/config'

// Pages - Common
import HomePage from './components/Home';
import Dashboard from './components/Dashboard';
import LoginPage from './components/auth/LoginPage';
import RegistrationPage from './components/auth/RegisterPage';
import Profile from './pages/Profile';
import Settings from './pages/Settings'; 
import MyHouse from './pages/MyHouse';
import NotFound from './components/NotFound';

// Tenant Pages
import Payments from './pages/PaymentPage';
import BrowseHouses from './components/BrowseHouses';

// Landlord Pages
import Houses from "./pages/Houses";
import Bookings from "./pages/Bookings";
import BookingForm from "./components/BookingForm";
import Invoices from "./pages/Invoices";

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// Auth context to manage user auth state across the app
const AuthContext = React.createContext({
  isAuthenticated: false,
  userRole: null,
  login: () => {},
  logout: () => {},
  isLoading: true
});

// Export the useAuth hook
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check for auth token on component mount
    const checkAuth = () => {
      const token = localStorage.getItem(STORAGE_KEYS.authToken);
      const role = localStorage.getItem(STORAGE_KEYS.userRole);
      
      setIsAuthenticated(!!token);
      setUserRole(role);
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  const login = (token, role) => {
    localStorage.setItem(STORAGE_KEYS.authToken, token);
    localStorage.setItem(STORAGE_KEYS.userRole, role);
    setIsAuthenticated(true);
    setUserRole(role);
  };
  
  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.authToken);
    localStorage.removeItem(STORAGE_KEYS.userRole);
    localStorage.removeItem(STORAGE_KEYS.userInfo);
    setIsAuthenticated(false);
    setUserRole(null);
  };
  
  const value = {
    isAuthenticated,
    userRole,
    login,
    logout,
    isLoading
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// AuthLayout component for login and registration pages
const AuthLayout = () => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const redirectPath = userRole === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, userRole, navigate, isLoading]);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <Box 
        sx={{ 
          p: 4, 
          borderRadius: 2, 
          boxShadow: 3, 
          bgcolor: 'background.paper',
          width: '100%',
          maxWidth: 450
        }}
      >
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          {APP_SETTINGS.appName}
        </Typography>
        <Outlet />
      </Box>
    </Box>
  );
};

// MainLayout component with navigation for authenticated users
const MainLayout = ({ userRole }) => {
  const { isAuthenticated, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      { text: 'Profile', icon: <AccountCircleIcon />, path: '/profile' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ];
    
    const tenantItems = [
      { text: 'Dashboard', icon: <HomeIcon />, path: '/tenant/dashboard' },
      { text: 'My House', icon: <HouseIcon />, path: '/tenant/house' },
      { text: 'Payments', icon: <PaymentIcon />, path: '/tenant/payments' },
      { text: 'Browse Houses', icon: <SearchIcon />, path: '/tenant/browse' },
    ];
    
    const landlordItems = [
      { text: 'Dashboard', icon: <HomeIcon />, path: '/landlord/dashboard' },
      { text: 'Houses', icon: <HouseIcon />, path: '/landlord/houses' },
      { text: 'Bookings', icon: <BookIcon />, path: '/landlord/bookings' },
      { text: 'Booking Form', icon: <BookIcon />, path: '/landlord/booking-form' },
      { text: 'Invoices', icon: <ReceiptIcon />, path: '/landlord/invoices' },
    ];
    
    return userRole === 'landlord' ? [...landlordItems, ...commonItems] : [...tenantItems, ...commonItems];
  };
  
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Only redirect if we've confirmed authentication status and user is not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {APP_SETTINGS.appName}
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <Typography variant="h6" sx={{ p: 2 }}>
            {userRole === 'landlord' ? 'Landlord Menu' : 'Tenant Menu'}
          </Typography>
          <Divider />
          <List>
            {getNavItems().map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={location.pathname === item.path}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          minHeight: '100vh'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

// Route redirector based on user role
const RoleRouter = () => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
      } else if (userRole === 'landlord') {
        navigate('/landlord/dashboard', { replace: true });
      } else if (userRole === 'tenant') {
        navigate('/tenant/dashboard', { replace: true });
      } else {
        // If role is not recognized, redirect to login
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, userRole, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return null;
};

// Enhanced protected route component that checks both authentication and roles
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Only redirect if we've confirmed authentication status
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Only check role after we've confirmed user is authenticated
  if (!isLoading && requiredRole && userRole !== requiredRole) {
    // Redirect based on role
    return <Navigate to={userRole === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard'} replace />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes with No Layout */}
            <Route path="/" element={<HomePage />} />
            
            {/* Public Routes with Auth Layout */}
            <Route element={<AuthLayout />}>
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>
            
            {/* Role-based Redirector */}
            <Route path="/dashboard" element={<RoleRouter />} />
            
            {/* Common Protected Routes */}
            <Route element={<MainLayout userRole="common" />}>
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Tenant Protected Routes */}
            <Route path="/tenant" element={<MainLayout userRole="tenant" />}>
              <Route path="dashboard" element={
                <ProtectedRoute requiredRole="tenant">
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="house" element={
                <ProtectedRoute requiredRole="tenant">
                  <MyHouse />
                </ProtectedRoute>
              } />
              <Route path="payments" element={
                <ProtectedRoute requiredRole="tenant">
                  <Payments />
                </ProtectedRoute>
              } />
              <Route path="browse" element={
                <ProtectedRoute requiredRole="tenant">
                  <BrowseHouses />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Landlord Protected Routes */}
            <Route path="/landlord" element={<MainLayout userRole="landlord" />}>
              <Route path="dashboard" element={
                <ProtectedRoute requiredRole="landlord">
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="houses" element={
                <ProtectedRoute requiredRole="landlord">
                  <Houses />
                </ProtectedRoute>
              } />
              <Route path="bookings" element={
                <ProtectedRoute requiredRole="landlord">
                  <Bookings />
                </ProtectedRoute>
              } />
              <Route path="booking-form" element={
                <ProtectedRoute requiredRole="landlord">
                  <BookingForm />
                </ProtectedRoute>
              } />
              <Route path="invoices" element={
                <ProtectedRoute requiredRole="landlord">
                  <Invoices />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;