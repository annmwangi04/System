import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HouseCard from './HouseCard'

const HouseListingPage = () => {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get auth token from localStorage or your auth management system
  const authToken = localStorage.getItem('authToken');
  
  // Check if the user is a landlord
  const userRole = localStorage.getItem('userRole'); // 'landlord', 'tenant', etc.
  const isLandlord = userRole === 'landlord';
  
  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const response = await axios.get('/api/houses/', {
          headers: {
            'Authorization': `Token ${authToken}`
          }
        });
        setHouses(response.data);
      } catch (err) {
        console.error('Error fetching houses:', err);
        setError('Failed to load houses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHouses();
  }, [authToken]);
  
  // Handle house update (e.g., after image upload)
  const handleHouseUpdate = (updatedHouse) => {
    setHouses(houses.map(house => 
      house.id === updatedHouse.id ? updatedHouse : house
    ));
  };
  
  if (loading) {
    return <div className="p-8 text-center">Loading houses...</div>;
  }
  
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Available Properties</h1>
      
      {houses.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p>No houses available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {houses.map(house => (
            <HouseCard
              key={house.id}
              house={house}
              authToken={authToken}
              isOwner={isLandlord && house.apartment_owner_id === parseInt(localStorage.getItem('landlordId'))}
              onUpdate={handleHouseUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HouseListingPage;