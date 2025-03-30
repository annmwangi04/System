import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// You'll need to adjust this path based on your project structure
import { API_BASE_URL } from './config'

function BrowseHouses() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    apartmentId: '',
    houseTypeId: '',
    minPrice: '',
    maxPrice: '',
  });
  const [apartments, setApartments] = useState([]);
  const [houseTypes, setHouseTypes] = useState([]);
  
  // Fetch houses and filter options on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch available houses - filter by vacant status
        const housesResponse = await axios.get(`${API_BASE_URL}/api/houses/`, {
          params: { status: 'vacant' }
        });
        
        // Fetch apartments for filtering
        const apartmentsResponse = await axios.get(`${API_BASE_URL}/api/apartments/`);
        
        // Fetch house types for filtering
        const houseTypesResponse = await axios.get(`${API_BASE_URL}/api/house-types/`);
        
        setHouses(housesResponse.data);
        setApartments(apartmentsResponse.data);
        setHouseTypes(houseTypesResponse.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load houses. Please try again later.');
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };
    
    fetchData();
  }, []);
  
  // Apply filters when user submits the filter form
  const handleFilterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Build query parameters from filters
      const params = { status: 'vacant' };
      
      if (filters.apartmentId) {
        params.apartment_id = filters.apartmentId;
      }
      
      if (filters.houseTypeId) {
        params.house_type_id = filters.houseTypeId;
      }
      
      // Fetch filtered houses
      const response = await axios.get(`${API_BASE_URL}/api/houses/`, { params });
      
      // Apply client-side price filtering
      let filteredHouses = response.data;
      
      if (filters.minPrice) {
        filteredHouses = filteredHouses.filter(
          house => house.monthly_rent >= parseFloat(filters.minPrice)
        );
      }
      
      if (filters.maxPrice) {
        filteredHouses = filteredHouses.filter(
          house => house.monthly_rent <= parseFloat(filters.maxPrice)
        );
      }
      
      setHouses(filteredHouses);
      setLoading(false);
    } catch (err) {
      setError('Failed to apply filters. Please try again.');
      setLoading(false);
      console.error('Error applying filters:', err);
    }
  };
  
  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      apartmentId: '',
      houseTypeId: '',
      minPrice: '',
      maxPrice: '',
    });
    
    // Re-fetch all houses
    axios.get(`${API_BASE_URL}/api/houses/`, { params: { status: 'vacant' } })
      .then(response => setHouses(response.data))
      .catch(err => {
        setError('Failed to reset filters. Please try again.');
        console.error('Error resetting filters:', err);
      });
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Available Houses</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Available Houses</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Available Houses</h1>
      
      {/* Filter Section */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Filter Houses</h2>
        <form onSubmit={handleFilterSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Apartment Filter */}
            <div>
              <label htmlFor="apartmentId" className="block text-sm font-medium text-gray-700 mb-1">
                Apartment
              </label>
              <select
                id="apartmentId"
                name="apartmentId"
                value={filters.apartmentId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Apartments</option>
                {apartments.map(apartment => (
                  <option key={apartment.id} value={apartment.id}>
                    {apartment.name} - {apartment.location}
                  </option>
                ))}
              </select>
            </div>
            
            {/* House Type Filter */}
            <div>
              <label htmlFor="houseTypeId" className="block text-sm font-medium text-gray-700 mb-1">
                House Type
              </label>
              <select
                id="houseTypeId"
                name="houseTypeId"
                value={filters.houseTypeId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                {houseTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Min Price Filter */}
            <div>
              <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min Price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Max Price Filter */}
            <div>
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max Price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex justify-end mt-4 space-x-3">
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>
      
      {/* Results Section */}
      {houses.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <p>No houses found matching your criteria. Try adjusting your filters.</p>
        </div>
      ) : (
        <p className="mb-4 text-gray-600">{houses.length} houses available</p>
      )}
      
      {/* Houses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {houses.map(house => (
          <div 
            key={house.id} 
            className="border rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
          >
            {/* House Image */}
            <div className="h-48 bg-gray-200">
              {house.image ? (
                <img 
                  src={house.image} 
                  alt={`House ${house.number}`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200 text-gray-500">
                  <span>No image available</span>
                </div>
              )}
            </div>
            
            {/* House Details */}
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">House {house.number}</h3>
                  <p className="text-gray-600">{house.apartment.name}</p>
                </div>
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                  Available
                </div>
              </div>
              
              <div className="mt-3">
                <p><span className="font-medium">Type:</span> {house.house_type.name}</p>
                <p><span className="font-medium">Location:</span> {house.apartment.location}</p>
                <p className="text-xl font-bold mt-2">${house.monthly_rent}/month</p>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{house.bedrooms} Bedroom{house.bedrooms !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span>{house.bathrooms} Bathroom{house.bathrooms !== 1 ? 's' : ''}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <Link 
                  to={`/houses/${house.id}`} 
                  className="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700 transition-colors duration-300"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination could be added here if needed */}
    </div>
  );
}

export default BrowseHouses;