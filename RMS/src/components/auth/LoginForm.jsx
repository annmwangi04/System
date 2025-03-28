import React, { useState } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  useNavigate 
} from 'react-router-dom';
import axios from 'axios';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Box,
  CircularProgress
} from '@mui/material';

// Create a base axios instance with default configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json'
  }
});

const LoginForm = () => {
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Use navigate hook inside the component
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prevState => ({
      ...prevState,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const Response = await api.post('token/', {
        username: loginData.username,
        password: loginData.password
      });

      // If login successful, navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = 
        err.response?.data?.detail || 
        'Login failed. Please check your credentials.';
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
          Sign in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            name="username"
            value={loginData.username}
            onChange={handleChange}
            autoFocus
            disabled={isLoading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            value={loginData.password}
            onChange={handleChange}
            disabled={isLoading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginForm;
