import React, { useState } from "react";
import axios from "axios";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  TextField,
  Box,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  AccountCircle as UserIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

import welcomeImage from "../assets/welcome-background.jpg";
import aboutUsImage from "../assets/about-us-image.jpg";

// Create a custom theme with improved responsiveness
const Theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  palette: {
    primary: {
      main: "#2E7D32",
    },
    secondary: {
      main: "#607D8B", // Grey color for navbar
    },
    background: {
      default: "#F5F5F5",
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h2: {
      fontWeight: 700,
      fontSize: "3rem",
      "@media (max-width:600px)": {
        fontSize: "2rem",
      },
    },
    h4: {
      fontWeight: 600,
      "@media (max-width:600px)": {
        fontSize: "1.5rem",
      },
    },
    body1: {
      "@media (max-width:600px)": {
        fontSize: "0.875rem",
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          padding: "12px 24px",
          "@media (max-width:600px)": {
            padding: "8px 16px",
            fontSize: "0.875rem",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "@media (max-width:600px)": {
            marginBottom: "8px",
          },
        },
      },
    },
  },
});

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Input validation functions
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password) => {
    // At least 8 characters, one uppercase, one lowercase, one number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(password);
  };

  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      // Implement contact form submission logic
      console.log("Contact form submitted", formData);
      // You would typically send this data to a backend API
    } catch (error) {
      console.error("Contact form submission error", error);
    }
  };

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    // Clear previous login errors when user starts typing
    setLoginError("");
  };

  const handleSignupInputChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setSignupError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      // Validate input
      if (!loginData.email || !loginData.password) {
        setLoginError("Please enter both email and password");
        setIsLoading(false);
        return;
      }

      // Attempt login
      const response = await axios.post('/api/login/', {
        email: loginData.email,
        password: loginData.password
      });

      // Successful login
      const { token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Reset login form and close dialog
      setLoginData({ email: "", password: "" });
      handleDashboardClose();

      // Optional: Redirect to dashboard or update app state
      // history.push('/dashboard');
      alert('Login Successful!');

    } catch (error) {
      // Handle login errors
      const errorMessage = error.response?.data?.error || 
                           'Login failed. Please check your credentials.';
      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError("");

    // Comprehensive validation
    if (!signupData.fullName) {
      setSignupError("Full Name is required");
      return;
    }

    if (!validateEmail(signupData.email)) {
      setSignupError("Invalid email format");
      return;
    }

    if (!validatePassword(signupData.password)) {
      setSignupError("Password must be at least 8 characters, include uppercase, lowercase, and number");
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setSignupError("Passwords do not match");
      return;
    }

    try {
      const Response = await axios.post('/api/signup/', {
        fullName: signupData.fullName,
        email: signupData.email,
        password: signupData.password
      });

      alert('Signup Successful! Please log in.');
      
      // Reset signup form and switch to login tab
      setSignupData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
      setTabValue(0);

    } catch (error) {
      console.error("Signup error", error);
      const errorMessage = error.response?.data?.error || 'Signup failed';
      setSignupError(errorMessage);
    }
  };

  const handleDashboardOpen = () => {
    setDashboardOpen(true);
  };

  const handleDashboardClose = () => {
    setDashboardOpen(false);
    // Reset login error and form when closing
    setLoginError("");
    setLoginData({ email: "", password: "" });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Clear any previous errors when switching tabs
    setLoginError("");
    setSignupError("");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <ThemeProvider theme={Theme}>
       <AppBar 
      position="fixed"  // This is the key prop to keep the navbar fixed
      color="primary"
      sx={{
        zIndex: 1000,  // Ensures navbar stays on top of other content
        top: 0,        // Positions at the top of the screen
        left: 0,       // Ensures full width
        right: 0       // Ensures full width
      }}
    >

        <Toolbar>
          <Typography
            variant="h5"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: "bold",
              color: "white",
            }}
          >
            Rental Management System
          </Typography>
          
          {isMobile ? (
            <IconButton color="inherit" onClick={toggleMobileMenu}>
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton color="inherit" onClick={handleDashboardOpen}>
                <UserIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
        </AppBar>

      <main
        style={{
          marginTop: "64px",
          backgroundColor: theme.palette.background.default,
        }}
      >
        {/* Welcome Section */}
        <section
          style={{
            minHeight: "80vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, rgba(0,128,0,0.8) 0%, rgba(128,128,128,0.8) 100%), url(${welcomeImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: "white",
            textAlign: "center",
            padding: theme.spacing(4),
          }}
        >
          <Container maxWidth="md">
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                fontWeight: "bold",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              Welcome to Your Property Management Solution
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 300,
                opacity: 0.9,
              }}
            >
              Tired of juggling rent payments, maintenance requests, and tenant
              communications? Join our revolutionary rental management platform
              where property ownership becomes effortless. Our user-friendly
              dashboard puts everything you need at your fingertips – from
              automated rent collection to real-time financial reporting.
              Experience the peace of mind that comes with complete visibility
              into your rental business while saving hours of administrative
              work each month. Log in now and transform your property management
              experience with just a few clicks.
            </Typography>
            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleDashboardOpen}
              >
                Get Started
              </Button>
            </Box>
          </Container>
        </section>

        {/* About Us Section */}
        <Container sx={{ py: 8 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  height: { xs: 300, sm: 500 },
                  backgroundImage: `url(${aboutUsImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography
                variant="h4"
                gutterBottom
                color="primary"
                sx={{
                  fontWeight: 600,
                  "@media (max-width:600px)": {
                    fontSize: "1.5rem",
                  },
                }}
              >
                About RMS.
              </Typography>
              <Typography variant="body1" paragraph>
                RentEase is a comprehensive property management platform
                designed to bridge the gap between landlords and tenants. Our
                innovative solution streamlines rental processes, making
                property management effortless and transparent.
              </Typography>
              <Typography variant="body1" paragraph>
                We provide tools for seamless communication, rent tracking,
                maintenance requests, and financial management. Whether you're a
                property owner or a tenant, RentEase simplifies your rental
                experience.
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Button variant="outlined" color="primary">
                  Learn More
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* Contact Section */}
        <section style={{ backgroundColor: "#f5f5f5", padding: "4rem 0" }}>
          <Container>
            <Grid container spacing={4}>
              {/* Contact Form */}
              <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                  <Typography
                    variant="h4"
                    align="center"
                    gutterBottom
                    color="primary"
                    sx={{ color: "#4a5e6d" }}
                  >
                    Contact Us
                  </Typography>
                  <Box
                    component="form"
                    onSubmit={handleContactSubmit}
                    noValidate
                  >
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="name"
                      label="Name"
                      name="name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleContactInputChange}
                      variant="outlined"
                    />
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleContactInputChange}
                      variant="outlined"
                    />
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="message"
                      label="Message"
                      type="text"
                      id="message"
                      multiline
                      rows={4}
                      value={formData.message}
                      onChange={handleContactInputChange}
                      variant="outlined"
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      color="primary"
                      sx={{ mt: 3, mb: 2 }}
                    >
                      Send Message
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              {/* Google Maps and Social Media */}
              <Grid item xs={12} md={6}>
                <Typography
                  variant="h4"
                  align="center"
                  gutterBottom
                  color="primary"
                >
                  Find Us
                </Typography>
                {/* Embedded Google Maps */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8106463075954!2d36.81236837502305!3d-1.2924668990260894!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f10d093c7c709%3A0xbebf4d32e37f6610!2sUpper%20Hill%2C%20Nairobi!5e0!3m2!1sen!2ske!4v1711460845584!5m2!1sen!2ske" 
                  width="100%"
                  height="400"
                  style={{
                    border: 0,
                    borderRadius: "16px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>

                {/* Social Media Icons */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 2,
                    mt: 3,
                  }}
                >
                  <IconButton color="primary" href="#" size="large">
                    <FacebookIcon fontSize="large" />
                  </IconButton>
                  <IconButton color="secondary" href="#" size="large">
                    <InstagramIcon fontSize="large" />
                  </IconButton>
                  <IconButton color="primary" href="#" size="large">
                    <LinkedInIcon fontSize="large" />
                  </IconButton>
                  <IconButton color="info" href="#" size="large">
                    <TwitterIcon fontSize="large" />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </section>
      </main>

      {/* Dashboard/Login Dialog */}
      <Dialog
        open={dashboardOpen}
        onClose={handleDashboardClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Login" />
            <Tab label="Sign Up" />
          </Tabs>
        </DialogTitle>
        <DialogContent>
          {tabValue === 0 && (
            <Box component="form" onSubmit={handleLoginSubmit} sx={{ mt: 2 }}>
              {loginError && (
                <Box 
                  sx={{ 
                    backgroundColor: 'error.light', 
                    color: 'error.contrastText',
                    p: 2,
                    mb: 2,
                    borderRadius: 1
                  }}
                >
                  {loginError}
                </Box>
              )}
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                variant="outlined"
                value={loginData.email}
                onChange={handleLoginInputChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                variant="outlined"
                value={loginData.password}
                onChange={handleLoginInputChange}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={isLoading}
                sx={{ mt: 3, mb: 2 }}
              >
                {isLoading ? 'Logging In...' : 'Login'}
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button color="primary" variant="text">
                  Forgot Password?
                </Button>
              </Box>
            </Box>
          )}
          {tabValue === 1 && (
            <Box component="form" onSubmit={handleSignupSubmit} sx={{ mt: 2 }}>
              {signupError && (
                <Box 
                  sx={{ 
                    backgroundColor: 'error.light', 
                    color: 'error.contrastText',
                    p: 2,
                    mb: 2,
                    borderRadius: 1
                  }}
                >
                  {signupError}
                </Box>
              )}
              <TextField
                margin="normal"
                required
                fullWidth
                label="Full Name"
                name="fullName"
                autoFocus
                variant="outlined"
                value={signupData.fullName}
                onChange={handleSignupInputChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                name="email"
                autoComplete="email"
                variant="outlined"
                value={signupData.email}
                onChange={handleSignupInputChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                variant="outlined"
                value={signupData.password}
                onChange={handleSignupInputChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                variant="outlined"
                value={signupData.confirmPassword}
                onChange={handleSignupInputChange}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDashboardClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default Home;