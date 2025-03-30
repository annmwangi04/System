import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// You'll need to adjust this path based on your project structure
import { API_BASE_URL } from '../config';

function HouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  
  // Fetch house details and user information on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get current user information
        const userResponse = await axios.get(`${API_BASE_URL}/api/users/current/`, {
          headers: {
            Authorization: `Token ${localStorage.getItem('authToken')}`
          }
        });
        setUser(userResponse.data);
        
        // Get house details
        const houseResponse = await axios.get(`${API_BASE_URL}/api/houses/${id}/`);
        setHouse(houseResponse.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load house details. Please try again later.');
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Handle booking submission
  const handleBookHouse = async () => {
    // Check if user is logged in
    if (!user) {
      // Save the current page to redirect back after login
      localStorage.setItem('redirectAfterLogin', `/houses/${id}`);
      navigate('/login');
      return;
    }
    
    // Check if user has a tenant profile
    if (!user.tenant) {
      setBookingStatus({
        type: 'error',
        message: 'You need to create a tenant profile before booking a house.'
      });
      return;
    }
    
    try {
      setBookingStatus({ type: 'loading', message: 'Processing your booking...' });
      
      // Create a house booking
      await axios.post(`${API_BASE_URL}/api/house-bookings/`, {
        house_id: house.id,
        tenant_id: user.tenant.id,
        status: 'pending'
      }, {
        headers: {
          Authorization: `Token ${localStorage.getItem('authToken')}`
        }
      });
      
      setBookingStatus({
        type: 'success',
        message: 'Your booking request has been submitted successfully. The landlord will review your application.'
      });
      
    } catch (err) {
      setBookingStatus({
        type: 'error',
        message: 'Failed to book this house. Please try again later.'
      });
      console.error('Error booking house:', err);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
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
  
  // Return null if house is not loaded yet
  if (!house) return null;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/" className="text-gray-700 hover:text-blue-600">
                Home
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <a href="/houses" className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2">
                  Houses
                </a>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-gray-500 md:ml-2">House {house.number}</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* House Image Gallery */}
        <div className="h-64 md:h-96 bg-gray-200">
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
        
        {/* House Information */}
        <div className="p-6">
          <div className="flex flex-wrap justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">House {house.number}</h1>
              <p className="text-gray-600 text-lg">{house.apartment.name} • {house.apartment.location}</p>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Available
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap justify-between">
            <div className="w-full md:w-8/12">
              <h2 className="text-xl font-semibold mb-4">Details</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-600">Type</p>
                  <p className="font-medium">{house.house_type.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-medium capitalize">{house.status}</p>
                </div>
                <div>
                  <p className="text-gray-600">Bedrooms</p>
                  <p className="font-medium">{house.bedrooms}</p>
                </div>
                <div>
                  <p className="text-gray-600">Bathrooms</p>
                  <p className="font-medium">{house.bathrooms}</p>
                </div>
                <div>
                  <p className="text-gray-600">Size</p>
                  <p className="font-medium">{house.square_footage} sq ft</p>
                </div>
                <div>
                  <p className="text-gray-600">Furnished</p>
                  <p className="font-medium">{house.is_furnished ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 mb-6">{house.description || 'No description available for this property.'}</p>
              
              <h3 className="text-lg font-semibold mb-2">Amenities</h3>
              <ul className="list-disc pl-5 mb-6 text-gray-700">
                {house.amenities ? (
                  house.amenities.split(',').map((amenity, index) => (
                    <li key={index} className="mb-1">{amenity.trim()}</li>
                  ))
                ) : (
                  <li>No amenities listed</li>
                )}
              </ul>
              
              <h3 className="text-lg font-semibold mb-2">Apartment Information</h3>
              <p className="text-gray-700 mb-2"><span className="font-medium">Name:</span> {house.apartment.name}</p>
              <p className="text-gray-700 mb-2"><span className="font-medium">Type:</span> {house.apartment.apartment_type.name}</p>
              <p className="text-gray-700 mb-2"><span className="font-medium">Location:</span> {house.apartment.location}</p>
              <p className="text-gray-700 mb-6"><span className="font-medium">Nearby Facilities:</span> {house.apartment.nearby_facilities || 'Not specified'}</p>
            </div>
            
            <div className="w-full md:w-3/12 bg-gray-50 p-4 rounded-lg">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-blue-600">${house.monthly_rent}</p>
                <p className="text-gray-600">per month</p>
              </div>
              
              {/* Booking Status Message */}
              {bookingStatus && (
                <div className={`p-3 rounded mb-4 ${
                  bookingStatus.type === 'error' ? 'bg-red-100 text-red-700' : 
                  bookingStatus.type === 'success' ? 'bg-green-100 text-green-700' : 
                  'bg-blue-100 text-blue-700'
                }`}>
                  <p>{bookingStatus.message}</p>
                </div>
              )}
              
              {/* Book Now Button */}
              <button
                onClick={handleBookHouse}
                disabled={bookingStatus?.type === 'success'}
                className={`w-full py-3 px-4 rounded font-medium text-white ${
                  bookingStatus?.type === 'success' 
                    ? 'bg-green-600' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {bookingStatus?.type === 'success' ? 'Booking Submitted' : 'Book Now'}
              </button>
              
              <div className="mt-4 text-gray-600 text-sm">
                <p>* Booking is subject to approval by the landlord</p>
                <p>* Security deposit may be required</p>
                <p>* Tenant screening process may apply</p>
              </div>
              
              {/* Contact Landlord Section */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="font-medium mb-2">Property Owner</h3>
                <p>{house.apartment.owner.first_name} {house.apartment.owner.last_name}</p>
                <p className="text-sm text-gray-600 mt-2">For inquiries:</p>
                <p className="text-sm">{house.apartment.owner.email}</p>
                <p className="text-sm">{house.apartment.owner.phone_number}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Location Map would go here - Could use an iframe with Google Maps */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Location</h2>
        <div className="h-64 bg-gray-200 rounded flex items-center justify-center">
          <p className="text-gray-500">Map would be displayed here</p>
        </div>
      </div>
      
      {/* Related Houses Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Similar Houses</h2>
        <p className="text-gray-600">Related houses would be displayed here</p>
      </div>
    </div>
  );
}

export default HouseDetail;