import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProfileForm from '../components/Profile';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [roleProfile, setRoleProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    physicalAddress: '',
    idNumber: '',
    occupation: '',
    workplace: '',
    emergencyContactPhone: ''
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get current user info
        const userResponse = await axios.get('/api/users/current/');
        const userData = userResponse.data;
        setUser(userData);

        // Initialize form with user data
        setFormData(prevData => ({
          ...prevData,
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          email: userData.email || ''
        }));

        // Check for role-specific profiles (landlord or tenant)
        if (userData.is_landlord) {
          try {
            const landlordResponse = await axios.get(`/api/landlords/?user_id=${userData.id}`);
            if (landlordResponse.data.results && landlordResponse.data.results.length > 0) {
              const landlordData = landlordResponse.data.results[0];
              setRoleProfile({
                ...landlordData,
                role: 'landlord'
              });
              
              // Update form data with landlord profile information
              setFormData(prevData => ({
                ...prevData,
                firstName: landlordData.first_name || userData.first_name || '',
                lastName: userData.last_name || '',
                email: landlordData.email || userData.email || '',
                phoneNumber: landlordData.phone_number || '',
                physicalAddress: landlordData.physical_address || '',
                idNumber: landlordData.id_number || ''
              }));
            }
          } catch (error) {
            console.error('Error fetching landlord profile:', error);
          }
        } else if (userData.is_tenant) {
          try {
            const tenantResponse = await axios.get(`/api/tenants/?user_id=${userData.id}`);
            if (tenantResponse.data.results && tenantResponse.data.results.length > 0) {
              const tenantData = tenantResponse.data.results[0];
              setRoleProfile({
                ...tenantData,
                role: 'tenant'
              });
              
              // Update form data with tenant profile information
              setFormData(prevData => ({
                ...prevData,
                phoneNumber: tenantData.phone_number || '',
                physicalAddress: tenantData.physical_address || '',
                idNumber: tenantData.id_number_or_passport || '',
                occupation: tenantData.occupation || '',
                workplace: tenantData.workplace || '',
                emergencyContactPhone: tenantData.emergency_contact_phone || ''
              }));
            }
          } catch (error) {
            console.error('Error fetching tenant profile:', error);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load profile data. Please try again later.');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Update user information (first_name, last_name, email)
      await axios.patch(`/api/users/${user.id}/`, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email
      });
      
      // Update role-specific profile
      if (roleProfile) {
        if (roleProfile.role === 'landlord') {
          await axios.patch(`/api/landlords/${roleProfile.id}/`, {
            first_name: formData.firstName,
            email: formData.email,
            phone_number: formData.phoneNumber,
            physical_address: formData.physicalAddress,
            id_number: formData.idNumber
          });
        } else if (roleProfile.role === 'tenant') {
          await axios.patch(`/api/tenants/${roleProfile.id}/`, {
            id_number_or_passport: formData.idNumber,
            phone_number: formData.phoneNumber,
            physical_address: formData.physicalAddress,
            occupation: formData.occupation,
            workplace: formData.workplace,
            emergency_contact_phone: formData.emergencyContactPhone
          });
        }
      }
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
      
      // Refresh user data
      const userResponse = await axios.get('/api/users/current/');
      setUser(userResponse.data);
      
      // Refresh role profile data
      if (roleProfile) {
        const endpoint = roleProfile.role === 'landlord' 
          ? `/api/landlords/${roleProfile.id}/` 
          : `/api/tenants/${roleProfile.id}/`;
        
        const profileResponse = await axios.get(endpoint);
        setRoleProfile({
          ...profileResponse.data,
          role: roleProfile.role
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Loading profile...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">User Profile</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none transition duration-200"
              disabled={loading}
            >
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none transition duration-200"
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>

        {user && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
              <div>
                <p className="text-gray-600 text-sm">Username</p>
                <p className="font-medium">{user.username}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Account Type</p>
                <p className="font-medium">
                  {user.is_staff ? 'Administrator' : roleProfile ? (roleProfile.role === 'landlord' ? 'Landlord' : 'Tenant') : 'Standard User'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Member Since</p>
                <p className="font-medium">{new Date(user.date_joined).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Last Login</p>
                <p className="font-medium">{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>
          </div>
        )}

        <ProfileForm 
          isEditing={isEditing}
          formData={formData}
          roleProfile={roleProfile}
          user={user}
          loading={loading}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={() => setIsEditing(false)}
        />
        
        {!roleProfile && !loading && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-lg font-semibold text-yellow-800">Role Assignment Required</h3>
            <p className="text-yellow-700 mt-2">
              You haven't been assigned a role yet. Please contact an administrator to be assigned as either a landlord or tenant to access all features.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;