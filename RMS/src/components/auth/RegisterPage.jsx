// RegistrationPage.jsx - Enhanced with navigation and persistence
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Snackbar,
  Paper,
  Grid,
  Divider,
  Link,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress
} from '@mui/material';

const RegistrationPage = () => {
  const navigate = useNavigate();
  
  // Initialize state for form data, errors, and snackbar
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    account_type: '',
    // Additional fields
    phone_number: '',
    physical_address: '',
    id_number: '',
    occupation: '',
    workplace: '',
    emergency_contact_phone: '',
    emergency_contact_name: '',
    agreed_to_terms: false
  });

  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error'
  });
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formHasChanges, setFormHasChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [checkingPhoneNumber, setCheckingPhoneNumber] = useState(false);

  // Create axios instance with correct configuration
  const customApi = axios.create({
    baseURL: 'http://localhost:8000/api/',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true  // Important for session authentication
  });

  // Load saved form data on component mount
  useEffect(() => {
    const savedData = sessionStorage.getItem('registrationFormData');
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
        // Check if we should continue from a previous step
        const savedStep = sessionStorage.getItem('registrationStep');
        if (savedStep) {
          setActiveStep(parseInt(savedStep, 10));
        }
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

  // Save form data on each change
  useEffect(() => {
    if (formHasChanges) {
      sessionStorage.setItem('registrationFormData', JSON.stringify(formData));
      sessionStorage.setItem('registrationStep', activeStep.toString());
    }
  }, [formData, activeStep, formHasChanges]);

  // Add confirmation before navigate away
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (formHasChanges && !registrationSuccess) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formHasChanges, registrationSuccess]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Flag that form has changes
    setFormHasChanges(true);
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Check if phone number is unique for landlords
  const checkPhoneNumberUniqueness = async () => {
    if (formData.account_type === 'landlord' && formData.phone_number) {
      setCheckingPhoneNumber(true);
      try {
        // Add an endpoint to check if phone number exists
        const response = await customApi.get(`landlords/check-phone/?phone_number=${encodeURIComponent(formData.phone_number)}`);
        
        // If the API doesn't exist, use a try-catch to handle potential errors
        // This is a fallback in case you don't have time to implement the API endpoint
        if (response.data.exists) {
          setErrors(prev => ({
            ...prev,
            phone_number: 'This phone number is already registered to another landlord'
          }));
          return false;
        }
        return true;
      } catch (error) {
        // If the API endpoint doesn't exist, we'll continue with the form submission
        // You should implement the API endpoint for proper validation
        console.log('Phone number check failed, continuing with submission:', error);
        return true;
      } finally {
        setCheckingPhoneNumber(false);
      }
    }
    return true;
  };

  // Form validation function
  const validateForm = () => {
    const newErrors = {};

    // Basic validation checks for current step
    if (activeStep === 0) {
      if (!formData.username) newErrors.username = 'Username is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.first_name) newErrors.first_name = 'First name is required';
      if (!formData.last_name) newErrors.last_name = 'Last name is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      // Password strength validation
      if (formData.password && formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      }
      
      // Email format validation
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      // Account type validation
      if (!formData.account_type) {
        newErrors.account_type = 'Account type is required';
      }
    }

    // Additional validations for the second step
    if (activeStep === 1) {
      if (!formData.phone_number) newErrors.phone_number = 'Phone number is required';
      if (!formData.physical_address) newErrors.physical_address = 'Physical address is required';
      if (!formData.id_number) newErrors.id_number = 'ID number is required';
      
      // Phone number format validation (simple example)
      if (formData.phone_number && !/^\d{10,15}$/.test(formData.phone_number.replace(/\D/g, ''))) {
        newErrors.phone_number = 'Please enter a valid phone number (10-15 digits)';
      }
      
      // Additional validations for tenant account type
      if (formData.account_type === 'tenant') {
        if (!formData.occupation) newErrors.occupation = 'Occupation is required';
        if (!formData.emergency_contact_phone) 
          newErrors.emergency_contact_phone = 'Emergency contact phone is required';
        if (!formData.emergency_contact_name) 
          newErrors.emergency_contact_name = 'Emergency contact name is required';
      }
    }

    // Final step validation
    if (activeStep === 2 && !formData.agreed_to_terms) {
      newErrors.agreed_to_terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form next step
  const handleNext = async () => {
    if (validateForm()) {
      // If going to the final step and user is a landlord, check phone number uniqueness
      if (activeStep === 1 && formData.account_type === 'landlord') {
        const isPhoneUnique = await checkPhoneNumberUniqueness();
        if (!isPhoneUnique) {
          return; // Don't proceed if phone number is not unique
        }
      }
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  // Handle form previous step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Handle exit from form
  const handleExit = () => {
    if (formHasChanges && !registrationSuccess) {
      setShowExitDialog(true);
    } else {
      navigate('/');
    }
  };

  // Handle confirm exit
  const handleConfirmExit = () => {
    sessionStorage.removeItem('registrationFormData');
    sessionStorage.removeItem('registrationStep');
    setShowExitDialog(false);
    navigate('/');
  };

  // Handle cancel exit
  const handleCancelExit = () => {
    setShowExitDialog(false);
  };

  // Handle automatic login after registration
  const loginAfterRegistration = async (username, password) => {
    try {
      const loginResponse = await customApi.post('login/', {
        username,
        password
      });
      
      // Store authentication token if returned by the API
      if (loginResponse.data.token) {
        localStorage.setItem('authToken', loginResponse.data.token);
        localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
      }
      
      return true;
    } catch (err) {
      console.error('Auto-login failed:', err);
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;
    
    // Check phone number uniqueness for landlords before submission
    if (formData.account_type === 'landlord') {
      const isPhoneUnique = await checkPhoneNumberUniqueness();
      if (!isPhoneUnique) {
        setActiveStep(1); // Go back to personal information step
        return;
      }
    }
    
    setLoading(true);

    try {
      // User registration
      console.log('Sending registration data:', {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password
      });

      const userResponse = await customApi.post('users/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        is_staff: false // Never register as admin
      });

      const userId = userResponse.data.id;
      console.log('User created successfully with ID:', userId);

      // Assign role
      console.log(`Assigning role ${formData.account_type} to user ${userId}`);
      
      try {
        const roleResponse = await customApi.post(`users/${userId}/assign_role/`, {
          role: formData.account_type
        });
        console.log('Role assignment response:', roleResponse.data);
        
        // Handle profile creation based on account type
        if (formData.account_type === 'landlord') {
          try {
            await customApi.post(`landlords/`, {
              user: userId,
              phone_number: formData.phone_number,
              physical_address: formData.physical_address,
              id_number: formData.id_number
            });
          } catch (profileError) {
            console.error('Landlord profile creation error:', profileError);
            
            // Handle the unique constraint error specifically
            if (profileError.response?.data?.error?.includes('UNIQUE constraint failed: accounts_landlord.phone_number') || 
                profileError.message?.includes('UNIQUE constraint failed: accounts_landlord.phone_number')) {
              throw new Error('This phone number is already registered to another landlord');
            }
            
            throw profileError;
          }
        } else if (formData.account_type === 'tenant') {
          await customApi.post(`tenants/`, {
            user: userId,
            phone_number: formData.phone_number,
            physical_address: formData.physical_address,
            id_number_or_passport: formData.id_number,
            occupation: formData.occupation,
            workplace: formData.workplace,
            emergency_contact_phone: formData.emergency_contact_phone,
            emergency_contact_name: formData.emergency_contact_name
          });
        }
      } catch (roleError) {
        console.error('Role assignment error:', {
          status: roleError.response?.status,
          data: roleError.response?.data,
          message: roleError.message
        });
        
        // Handle phone number uniqueness error
        if (roleError.message?.includes('phone number is already registered')) {
          setErrors(prev => ({
            ...prev,
            phone_number: 'This phone number is already registered to another landlord'
          }));
          setActiveStep(1); // Go back to personal information step
          throw new Error('This phone number is already registered to another landlord');
        }
        
        throw new Error(`Role assignment failed: ${roleError.response?.data?.error || roleError.message}`);
      }

      // Auto-login the user after successful registration
      const loginSuccess = await loginAfterRegistration(formData.username, formData.password);
      
      // Mark registration as successful
      setRegistrationSuccess(true);
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Registration successful as ${formData.account_type}${loginSuccess ? ' and you are now logged in!' : ''}`,
        severity: 'success'
      });

      // Clear session storage
      sessionStorage.removeItem('registrationFormData');
      sessionStorage.removeItem('registrationStep');
      
      // Reset form after successful registration
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        account_type: '',
        phone_number: '',
        physical_address: '',
        id_number: '',
        occupation: '',
        workplace: '',
        emergency_contact_phone: '',
        emergency_contact_name: '',
        agreed_to_terms: false
      });
      
      // Reset to first step
      setActiveStep(0);
      setFormHasChanges(false);
      
      // Navigate to dashboard if login was successful, otherwise to login page
      setTimeout(() => {
        navigate(loginSuccess ? '/dashboard' : '/login');
      }, 2000);

    } catch (err) {
      // Enhanced error logging
      console.error('Registration error:', err);
      
      // Check for specific phone number uniqueness error
      if (err.message?.includes('phone number is already registered')) {
        setSnackbar({
          open: true,
          message: 'This phone number is already registered to another landlord',
          severity: 'error'
        });
        setActiveStep(1); // Go back to personal information step
      } else {
        // Handle other errors
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
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Steps for the multi-step form
  const steps = ['Account Details', 'Personal Information', 'Terms & Review'];

  // Content for each step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
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
              helperText={errors.password || "Password must be at least 8 characters long"}
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

            {/* Account Type Selection */}
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
          </Box>
        );
      case 1:
        return (
          <Box>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              error={!!errors.phone_number}
              helperText={errors.phone_number}
              disabled={loading || checkingPhoneNumber}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Physical Address"
              name="physical_address"
              multiline
              rows={2}
              value={formData.physical_address}
              onChange={handleChange}
              error={!!errors.physical_address}
              helperText={errors.physical_address}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="ID Number/Passport"
              name="id_number"
              value={formData.id_number}
              onChange={handleChange}
              error={!!errors.id_number}
              helperText={errors.id_number}
              disabled={loading}
            />

            {/* Tenant-specific fields */}
            {formData.account_type === 'tenant' && (
              <>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Tenant Information
                </Typography>
                <FormControl 
                  fullWidth 
                  margin="normal"
                  error={!!errors.occupation}
                >
                  <InputLabel>Occupation</InputLabel>
                  <Select
                    name="occupation"
                    value={formData.occupation}
                    label="Occupation"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="employed">Employed</MenuItem>
                    <MenuItem value="self-employed">Self-Employed</MenuItem>
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="retired">Retired</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                  {errors.occupation && (
                    <Typography color="error" variant="caption" sx={{ ml: 2 }}>
                      {errors.occupation}
                    </Typography>
                  )}
                </FormControl>

                <TextField
                  margin="normal"
                  fullWidth
                  label="Workplace/Company"
                  name="workplace"
                  value={formData.workplace || ''}
                  onChange={handleChange}
                  disabled={loading}
                />

                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Emergency Contact
                </Typography>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Emergency Contact Name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name || ''}
                  onChange={handleChange}
                  error={!!errors.emergency_contact_name}
                  helperText={errors.emergency_contact_name}
                  disabled={loading}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Emergency Contact Phone"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone || ''}
                  onChange={handleChange}
                  error={!!errors.emergency_contact_phone}
                  helperText={errors.emergency_contact_phone}
                  disabled={loading}
                />
              </>
            )}

            {/* Landlord-specific fields could be added here */}
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Information
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Username:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">{formData.username}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle1">Name:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">{`${formData.first_name} ${formData.last_name}`}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle1">Email:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">{formData.email}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle1">Account Type:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  {formData.account_type === 'landlord' ? 'Landlord' : 'Tenant'}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle1">Phone Number:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">{formData.phone_number}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle1">Address:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">{formData.physical_address}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.agreed_to_terms}
                  onChange={handleChange}
                  name="agreed_to_terms"
                  color="primary"
                  disabled={loading}
                />
              }
              label="I agree to the Terms and Conditions"
            />
            {errors.agreed_to_terms && (
              <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
                {errors.agreed_to_terms}
              </Typography>
            )}
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                By clicking "Complete Registration", you agree to our Terms of Service and 
                Privacy Policy. You also agree to receive communications from us.
              </Typography>
            </Box>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 8, mb: 4 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Create Your Account
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            Join our property management platform and gain access to our services.
          </Typography>

          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ width: '100%' }}>
            {getStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              {activeStep === 0 ? (
                <Button
                  variant="outlined"
                  onClick={handleExit}
                  disabled={loading}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  disabled={activeStep === 0 || loading || checkingPhoneNumber}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>
              )}
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading || checkingPhoneNumber}
                >
                  {loading || checkingPhoneNumber ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                      Processing...
                    </Box>
                  ) : 'Complete Registration'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={loading || checkingPhoneNumber}
                >
                  {(activeStep === 1 && formData.account_type === 'landlord' && checkingPhoneNumber) ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                      Checking...
                    </Box>
                  ) : 'Next'}
                </Button>
              )}
            </Box>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" variant="body2">
                Sign in
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Confirmation Dialog for Exiting Form */}
      <Dialog
        open={showExitDialog}
        onClose={handleCancelExit}
        aria-labelledby="exit-dialog-title"
        aria-describedby="exit-dialog-description"
      >
        <DialogTitle id="exit-dialog-title">
          {"Are you sure you want to leave?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="exit-dialog-description">
            You have unsaved changes. If you leave now, your registration information will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelExit} color="primary">
            Stay on Page
          </Button>
          <Button onClick={handleConfirmExit} color="error" autoFocus>
            Leave Page
          </Button>
        </DialogActions>
      </Dialog>

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

export default RegistrationPage;