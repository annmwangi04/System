// Configuration settings for the rental management system
// This file contains global configuration values used throughout the application

// Base URL for API requests - update this to match your backend server
export const API_BASE_URL = 'http://localhost:8000/api';

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  login: `${API_BASE_URL}/auth/token/`,  // Updated to match your backend endpoint
  logout: `${API_BASE_URL}/auth/logout/`,
  signup: `${API_BASE_URL}/users/`,
  assignRole: (userId) => `${API_BASE_URL}/users/${userId}/assign_role/`
};

// User and profile endpoints
export const USER_ENDPOINTS = {
  profile: `${API_BASE_URL}/profiles/`,
  landlordProfile: `${API_BASE_URL}/landlords/`,
  tenantProfile: `${API_BASE_URL}/tenants/`
};

// Property endpoints
export const PROPERTY_ENDPOINTS = {
  apartments: `${API_BASE_URL}/apartments/`,
  houses: `${API_BASE_URL}/houses/`,
  apartmentTypes: `${API_BASE_URL}/apartment-types/`,
  houseTypes: `${API_BASE_URL}/house-types/`,
  uploadApartmentImage: (apartmentId) => `${API_BASE_URL}/apartments/${apartmentId}/upload_image/`
};

// Booking and invoice endpoints
export const BOOKING_ENDPOINTS = {
  bookings: `${API_BASE_URL}/bookings/`,  // Updated from house-bookings
  invoices: `${API_BASE_URL}/invoices/`
};

// Pagination settings
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 20, 50]
};

// Application settings
export const APP_SETTINGS = {
  appName: 'Rental Management System',
  dateFormat: 'YYYY-MM-DD',
  currency: 'KES', // Kenya Shillings
  currencySymbol: 'Ksh'
};

// Local storage keys
export const STORAGE_KEYS = {
  authToken: 'rms_auth_token',
  userInfo: 'rms_user_info',
  userRole: 'rms_user_role'
};