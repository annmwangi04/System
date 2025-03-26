import React, { useState, useEffect } from 'react';

const LandlordDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Safely parse user from localStorage
    const safelyParseUser = () => {
      try {
        const userString = localStorage.getItem('user');
        return userString ? JSON.parse(userString) : null;
      } catch (parseError) {
        console.error('Error parsing user from localStorage:', parseError);
        return null;
      }
    };

    // Set user safely
    const parsedUser = safelyParseUser();
    setUser(parsedUser);

    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/landlords/dashboard_stats/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Conditionally add Authorization header if token exists
            ...(parsedUser?.token && { 
              'Authorization': `Bearer ${parsedUser.token}` 
            })
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }

        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500 flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error}</p>
          <p className="text-sm mt-2">Please try refreshing the page or contact support.</p>
        </div>
      </div>
    );
  }

  // Additional check for stats and user
  if (!stats || !user) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-gray-600">
          No data available. Please log in again.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Landlord Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold">Total Apartments</h2>
          <p className="text-3xl font-bold">{stats.total_apartments || 0}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold">Total Houses</h2>
          <p className="text-3xl font-bold">{stats.total_houses || 0}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold">Occupied Houses</h2>
          <p className="text-3xl font-bold">{stats.occupied_houses || 0}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold">Total Tenants</h2>
          <p className="text-3xl font-bold">{stats.total_tenants || 0}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold">Total Income</h2>
          <p className="text-3xl font-bold">
            ₱{(stats.total_income || 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandlordDashboard;