import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/icons-material";

// Import your components and images
import LoginForm from "./auth/LoginPage";
import RegisterForm from "./auth/RegisterPage";

// Replace these with your actual image imports
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

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  // State for managing dialog and tabs
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact form input handler
  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Contact form submit handler
  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Implement contact form submission logic
    console.log("Contact Form Submitted", formData);
    // Reset form
    setFormData({
      name: "",
      email: "",
      message: "",
    });
    // Show success message or feedback
    alert("Thank you for your message! We'll get back to you soon.");
  };

  // Handler to open dashboard dialog
  const handleDashboardOpen = () => {
    setDashboardOpen(true);
  };

  // Handler to close dashboard dialog
  const handleDashboardClose = () => {
    setDashboardOpen(false);
  };

  // Handler for tab changes
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Mobile menu toggle handler
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Handle successful login or registration
  const handleAuthSuccess = (role) => {
    setDashboardOpen(false);
    
    // Navigate based on user role
    if (role === 'landlord') {
      navigate('/landlord-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <ThemeProvider theme={Theme}>
      <AppBar 
        position="fixed"
        color="primary"
        sx={{
          zIndex: 1000,
          top: 0,
          left: 0,
          right: 0
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
              <Button 
                color="inherit" 
                sx={{ mx: 1 }}
                onClick={() => navigate('/')}
              >
                Home
              </Button>
              <Button 
                color="inherit" 
                sx={{ mx: 1 }}
                onClick={() => {
                  const element = document.getElementById('about-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                About
              </Button>
              <Button 
                color="inherit" 
                sx={{ mx: 1 }}
                onClick={() => {
                  const element = document.getElementById('contact-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Contact
              </Button>
              <IconButton color="inherit" onClick={handleDashboardOpen}>
                <UserIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile menu drawer could be added here */}

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
            </Typography>
            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleDashboardOpen}
                sx={{
                  backgroundColor: "white",
                  color: theme.palette.primary.main,
                  "&:hover": {
                    backgroundColor: "#f0f0f0",
                  }
                }}
              >
                Get Started
              </Button>
            </Box>
          </Container>
        </section>

        {/* About Us Section */}
        <section id="about-section">
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
        </section>

        {/* Contact Section */}
        <section id="contact-section" style={{ backgroundColor: "#f5f5f5", padding: "4rem 0" }}>
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
                  title="Google Maps Location"
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
                  <IconButton color="primary" href="#" size="large" aria-label="Facebook">
                    <FacebookIcon fontSize="large" />
                  </IconButton>
                  <IconButton color="secondary" href="#" size="large" aria-label="Instagram">
                    <InstagramIcon fontSize="large" />
                  </IconButton>
                  <IconButton color="primary" href="#" size="large" aria-label="LinkedIn">
                    <LinkedInIcon fontSize="large" />
                  </IconButton>
                  <IconButton color="info" href="#" size="large" aria-label="Twitter">
                    <TwitterIcon fontSize="large" />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </section>
      </main>

      {/* Footer could be added here */}

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
            <LoginForm onLoginSuccess={handleAuthSuccess} />
          )}
          {tabValue === 1 && (
            <RegisterForm onRegisterSuccess={handleAuthSuccess} />
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

export default HomePage;