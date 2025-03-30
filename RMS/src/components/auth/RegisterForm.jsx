import React, { useState } from 'react';
import axios from 'axios';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar
} from '@mui/material';

const RegisterForm = () => {
  // Initialize state for form data, errors, and snackbar
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    is_admin: false,
    account_type: ''
  });

  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error'
  });
  const [loading, setLoading] = useState(false);

  // Create axios instance with correct configuration
  const customApi = axios.create({
    baseURL: 'http://localhost:8000/api/',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true  // Important for session authentication
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Form validation function
  const validateForm = () => {
    const newErrors = {};

    // Validation checks
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Account type validation for non-admin users
    if (!formData.is_admin && !formData.account_type) {
      newErrors.account_type = 'Account type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    
    setLoading(true);

    try {
      // User registration
      console.log('Sending registration data:', {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        is_staff: formData.is_admin,
        password: formData.password
      });

      const userResponse = await customApi.post('users/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        is_staff: formData.is_admin
      });

      const userId = userResponse.data.id;
      console.log('User created successfully with ID:', userId);

      // Assign role if not admin
      if (!formData.is_admin) {
        console.log(`Assigning role ${formData.account_type} to user ${userId}`);
        
        try {
          const roleResponse = await customApi.post(`users/${userId}/assign_role/`, {
            role: formData.account_type
          });
          console.log('Role assignment response:', roleResponse.data);
        } catch (roleError) {
          console.error('Role assignment error:', {
            status: roleError.response?.status,
            data: roleError.response?.data,
            message: roleError.message
          });
          throw new Error(`Role assignment failed: ${roleError.response?.data?.error || roleError.message}`);
        }
      }

      // Show success message
      setSnackbar({
        open: true,
        message: `Registration successful as ${formData.is_admin ? 'Administrator' : formData.account_type}`,
        severity: 'success'
      });

      // Reset form after successful registration
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        is_admin: false,
        account_type: ''
      });

    } catch (err) {
      // Enhanced error logging
      console.error('Registration error:', err);
      
      const errorMessage = 
        err.response?.data?.error || 
        err.response?.data?.username?.[0] || 
        err.response?.data?.email?.[0] || 
        err.message ||
        'Registration failed. Please try again.';

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="xs">
      <Box 
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Register
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={!!errors.username}
            helperText={errors.username}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            error={!!errors.first_name}
            helperText={errors.first_name}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            error={!!errors.last_name}
            helperText={errors.last_name}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            disabled={loading}
          />

          {/* Admin Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_admin}
                onChange={handleChange}
                name="is_admin"
                color="primary"
                disabled={loading}
              />
            }
            label="Register as Administrator"
          />

          {/* Account Type Selection (only if not admin) */}
          {!formData.is_admin && (
            <FormControl 
              fullWidth 
              margin="normal" 
              error={!!errors.account_type}
              disabled={loading}
            >
              <InputLabel>Account Type</InputLabel>
              <Select
                name="account_type"
                value={formData.account_type}
                label="Account Type"
                onChange={handleChange}
              >
                <MenuItem value="landlord">Landlord</MenuItem>
                <MenuItem value="tenant">Tenant</MenuItem>
              </Select>
              {errors.account_type && (
                <Typography color="error" variant="caption" sx={{ ml: 2 }}>
                  {errors.account_type}
                </Typography>
              )}
            </FormControl>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </Box>
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RegisterForm;