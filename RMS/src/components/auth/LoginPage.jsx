import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Visibility, VisibilityOff, Person, Lock, Home, Email } from '@mui/icons-material';
import { STORAGE_KEYS } from '../config';
import { useAuth } from '../../App';

// Define fallback storage keys in case import fails
const DEFAULT_STORAGE_KEYS = {
  authToken: 'auth_token',
  userRole: 'user_role',
  userInfo: 'user_info'
};

// Create a base axios instance with default configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // Add timeout to prevent hanging requests
});

// Add auth token to all requests - FIXED TOKEN FORMAT
api.interceptors.request.use(config => {
  const keys = STORAGE_KEYS || DEFAULT_STORAGE_KEYS;
  const token = localStorage.getItem(keys.authToken);
  if (token) {
    config.headers.Authorization = `Token ${token}`; // Changed from Bearer to Token
  }
  return config;
});

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  
  // Use navigate hook and Auth Context
  const navigate = useNavigate();
  const { login } = useAuth(); // Use the login function from AuthContext
  
  // Verify API URL on component mount
  useEffect(() => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';
    setApiUrl(url);
    console.log('API URL configured as:', url);
    
    // Test API connection - SIMPLIFIED VERSION
    const testConnection = async () => {
      try {
        // Use api instance with the interceptor for consistent auth
        await api.head('');
        console.log('API connection successful');
      } catch (err) {
        console.warn('API connection test failed:', err);
      }
    };
    
    testConnection();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prevState => ({
      ...prevState,
      [name]: value
    }));
    setError(''); // Clear error when user makes changes
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    console.log('Attempting login with:', { 
      username: loginData.username,
      apiUrl: apiUrl 
    });
    
    try {
      // Use the correct auth endpoint - ensure this matches your backend
      const authEndpoint = 'auth/token/';
      console.log('Making request to:', apiUrl + authEndpoint);
      
      const response = await api.post(authEndpoint, {
        username: loginData.username,
        password: loginData.password
      });
      
      console.log('Login successful, storing token and user info');
      
      // Get token from response
      const token = response.data.token || response.data.access;
      
      // Get user role from response - this assumes your API returns user role
      const userRole = response.data.user?.role || response.data.role || 'tenant';
      
      // Use AuthContext login instead of directly setting localStorage
      login(token, userRole);
      
      console.log('Auth state updated, token:', token);
      console.log('Auth state updated, role:', userRole);
      
      // If remember me is checked, set a separate flag
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      // Store user info if available in the response
      const keys = STORAGE_KEYS || DEFAULT_STORAGE_KEYS;
      if (response.data.user) {
        localStorage.setItem(keys.userInfo, JSON.stringify(response.data.user));
      }
      
      // Navigate based on role determined from the server response
      let redirectPath;
      switch (userRole) {
        case 'landlord':
          redirectPath = '/landlord/dashboard';
          break;
        case 'admin':
          redirectPath = '/admin/dashboard';
          break;
        case 'tenant':
        default:
          redirectPath = '/tenant/dashboard';
          break;
      }
      
      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Login error details:', err);
      
      let errorMessage;
      
      if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error: Please check your internet connection and try again.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again later.';
      } else if (err.response) {
        // Server responded with an error code
        if (err.response.status === 404) {
          errorMessage = 'Authentication endpoint not found. Please contact system administrator.';
        } else if (err.response.status === 401 || err.response.status === 400) {
          errorMessage = 'Invalid username or password. Please try again.';
        } else {
          // Try to extract message from response
          errorMessage = 
            err.response.data?.detail ||
            err.response.data?.non_field_errors?.[0] ||
            `Server error (${err.response.status}): Please try again later.`;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please try again later.';
      } else {
        // Something else caused the error
        errorMessage = 'Login failed: ' + (err.message || 'Unknown error');
      }
        
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Container component="main" maxWidth="sm">
      <Paper 
        elevation={3} 
        sx={{
          marginTop: 8,
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{
            padding: 3,
            backgroundColor: '#1976d2',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Home sx={{ fontSize: 32, mr: 2 }} />
          <Typography component="h1" variant="h4">
            Rental Management System
          </Typography>
        </Box>
        
        <Box 
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h2" variant="h5" sx={{ mb: 3 }}>
            Sign in to your account
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username or Email"
              name="username"
              value={loginData.username}
              onChange={handleChange}
              autoFocus
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="primary" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={loginData.password}
              onChange={handleChange}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    color="primary" 
                    disabled={isLoading}
                  />
                }
                label="Remember me"
              />
              <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Forgot password?
                </Typography>
              </Link>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isLoading || !loginData.username || !loginData.password}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography component="span" variant="body2" color="primary" fontWeight="bold">
                    Register here
                  </Typography>
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Rental Management System. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage;