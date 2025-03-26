import React, { useState, useEffect } from 'react';

const TenantDashboard = () => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTenantDetails = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        const response = await fetch(`http://127.0.0.1:8000/api/tenants/?search=${user.email}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tenant details');
        }

        const data = await response.json();
        
        if (data.length > 0) {
          // Fetch additional details like current house, invoices, etc.
          const tenantDetails = data[0];
          setTenant(tenantDetails);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTenantDetails();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Tenant Dashboard</h1>
      {tenant ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <p><strong>Name:</strong> {tenant.tenant_full_name}</p>
            <p><strong>Email:</strong> {tenant.email}</p>
            <p><strong>Phone:</strong> {tenant.phone_number}</p>
          </div>
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-xl font-semibold">Rental Details</h2>
            <p><strong>Physical Address:</strong> {tenant.physical_address}</p>
            <p><strong>Occupation:</strong> {tenant.occupation}</p>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          No tenant details found. Please complete your profile.
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;