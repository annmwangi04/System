import React, { useState } from 'react';
import axios from 'axios';

const RegistrationForm = ({ onRegistrationSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    tenantFullName: '',
    idNumber: '',
    phoneNumber: '',
    physicalAddress: '',
    occupation: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.role) newErrors.role = 'Please select a role';

    // Role-specific validations
    if (formData.role === 'tenant') {
      if (!formData.tenantFullName) newErrors.tenantFullName = 'Full Name is required';
      if (!formData.idNumber) newErrors.idNumber = 'ID Number is required';
      if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone Number is required';
      if (!formData.physicalAddress) newErrors.physicalAddress = 'Physical Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Step 1: Create User
      const userResponse = await axios.post('/api/users/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.role === 'tenant' ? formData.tenantFullName.split(' ')[0] : '',
        last_name: formData.role === 'tenant' ? formData.tenantFullName.split(' ')[1] || '' : ''
      });

      const userId = userResponse.data.id;

      // Step 2: Create Role-Specific Profile
      if (formData.role === 'tenant') {
        await axios.post('/api/tenants/', {
          user: userId,
          tenant_full_name: formData.tenantFullName,
          id_Number_or_passport: formData.idNumber,
          email: formData.email,
          phone_number: formData.phoneNumber,
          physical_address: formData.physicalAddress,
          occupation: formData.occupation || ''
        });
      } else if (formData.role === 'landlord') {
        await axios.post('/api/landlords/', {
          user_id: userId
        });
      }

      // Success - Call success callback and close dialog
      alert('Registration Successful! Please log in.');
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Registration Error:', error.response?.data || error.message);
      alert(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit}>
        {/* Common Fields */}
        <div className="mb-4">
          <label className="block mb-2">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            placeholder="Choose a username"
          />
          {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
        </div>

        <div className="mb-4">
          <label className="block mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        <div className="mb-4">
          <label className="block mb-2">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            placeholder="Create a password"
          />
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        <div className="mb-4">
          <label className="block mb-2">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            placeholder="Repeat your password"
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
        </div>

        {/* Role Selection */}
        <div className="mb-4">
          <label className="block mb-2">Select Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">Select Your Role</option>
            <option value="tenant">Tenant</option>
            <option value="landlord">Landlord</option>
          </select>
          {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
        </div>

        {/* Tenant-Specific Fields */}
        {formData.role === 'tenant' && (
          <>
            <div className="mb-4">
              <label className="block mb-2">Full Name</label>
              <input
                type="text"
                name="tenantFullName"
                value={formData.tenantFullName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
                placeholder="Enter your full name"
              />
              {errors.tenantFullName && <p className="text-red-500 text-sm">{errors.tenantFullName}</p>}
            </div>

            {/* Other tenant-specific fields remain the same */}
            {/* ... (previous tenant fields code) ... */}
          </>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300"
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;