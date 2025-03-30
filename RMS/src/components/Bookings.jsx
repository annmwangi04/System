import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

// Common components
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Spinner,
  Modal,
  Form,
  Alert,
  Pagination
} from '../components/ui';

const Bookings = () => {
  // State management
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [houses, setHouses] = useState([]);
  const [formData, setFormData] = useState({
    house_id: '',
    move_in_date: '',
    lease_term: '12',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch bookings data
  const fetchBookings = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/house-bookings/', {
        params: { page },
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        }
      });
      setBookings(response.data.results || response.data);
      setTotalPages(Math.ceil(response.data.count / 10) || 1);
      setCurrentPage(page);
      setLoading(false);
    } catch (err) {
      setError('Failed to load bookings. Please try again.');
      setLoading(false);
      console.error('Error fetching bookings:', err);
    }
  };

  // Fetch available houses
  const fetchAvailableHouses = async () => {
    try {
      const response = await axios.get('/api/houses/', {
        params: { status: 'vacant' },
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        }
      });
      setHouses(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching houses:', err);
      setError('Failed to load available houses.');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.house_id) errors.house_id = 'Please select a house';
    if (!formData.move_in_date) errors.move_in_date = 'Please select a move-in date';
    if (!formData.lease_term) errors.lease_term = 'Please specify lease term';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const Response = await axios.post('/api/house-bookings/', formData, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`
        }
      });
      
      // Show success message
      setSuccessMessage('Booking created successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        setShowModal(false);
        // Reset form
        setFormData({
          house_id: '',
          move_in_date: '',
          lease_term: '12',
          notes: ''
        });
        // Refresh bookings list
        fetchBookings();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking. Please try again.');
      console.error('Error creating booking:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setLoading(true);
      try {
        await axios.delete(`/api/house-bookings/${bookingId}/`, {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`
          }
        });
        setSuccessMessage('Booking cancelled successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          fetchBookings(currentPage);
        }, 2000);
      } catch (err) {
        setError('Failed to cancel booking. Please try again.');
        console.error('Error cancelling booking:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  // Fetch houses when modal is opened
  useEffect(() => {
    if (showModal) {
      fetchAvailableHouses();
    }
  }, [showModal]);

  // Render booking status with appropriate styling
  const renderStatus = (status) => {
    const statusStyles = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'completed': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
        <Button 
          onClick={() => setShowModal(true)} 
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Booking
        </Button>
      </div>

      {/* Success message */}
      {successMessage && (
        <Alert variant="success" className="mb-4">
          {successMessage}
        </Alert>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Bookings list */}
      {loading ? (
        <div className="flex justify-center my-12">
          <Spinner size="lg" />
        </div>
      ) : bookings.length === 0 ? (
        <Card className="bg-white shadow rounded-lg">
          <CardContent className="p-6 text-center text-gray-600">
            <p>You don't have any bookings yet.</p>
            <Button 
              onClick={() => setShowModal(true)} 
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Book a House
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="bg-white shadow rounded-lg overflow-hidden">
                <CardHeader className="bg-gray-50 px-4 py-3 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-700">
                      House #{booking.house.number}
                    </h3>
                    {renderStatus(booking.status)}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-600">Apartment:</span>
                      <span className="font-medium">{booking.house.apartment.name}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Move-in Date:</span>
                      <span className="font-medium">
                        {format(new Date(booking.move_in_date), 'PP')}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Lease Term:</span>
                      <span className="font-medium">{booking.lease_term} months</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Monthly Rent:</span>
                      <span className="font-medium">${booking.house.monthly_rent}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Booked On:</span>
                      <span className="font-medium">
                        {format(new Date(booking.date_added), 'PP')}
                      </span>
                    </li>
                  </ul>
                  
                  {booking.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Notes:</h4>
                      <p className="text-sm text-gray-600">{booking.notes}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-gray-50 px-4 py-3 border-t">
                  {booking.status === 'pending' && (
                    <Button 
                      onClick={() => handleCancelBooking(booking.id)}
                      className="w-full bg-red-500 text-white py-1.5 rounded text-sm"
                    >
                      Cancel Booking
                    </Button>
                  )}
                  {booking.status === 'approved' && (
                    <div className="text-center w-full text-green-600 text-sm">
                      Your booking has been approved
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => fetchBookings(page)}
              />
            </div>
          )}
        </>
      )}

      {/* New Booking Modal */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="Book a House"
      >
        <Form onSubmit={handleSubmit}>
          <div className="space-y-4 p-4">
            {/* House Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select House
              </label>
              <select
                name="house_id"
                value={formData.house_id}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  formErrors.house_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Select a house --</option>
                {houses.map((house) => (
                  <option key={house.id} value={house.id}>
                    {house.apartment.name} - House #{house.number} (${house.monthly_rent}/month)
                  </option>
                ))}
              </select>
              {formErrors.house_id && (
                <p className="mt-1 text-sm text-red-600">{formErrors.house_id}</p>
              )}
            </div>
            
            {/* Move-in Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Move-in Date
              </label>
              <input
                type="date"
                name="move_in_date"
                value={formData.move_in_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
                className={`w-full p-2 border rounded-md ${
                  formErrors.move_in_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.move_in_date && (
                <p className="mt-1 text-sm text-red-600">{formErrors.move_in_date}</p>
              )}
            </div>
            
            {/* Lease Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lease Term (months)
              </label>
              <select
                name="lease_term"
                value={formData.lease_term}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  formErrors.lease_term ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
              </select>
              {formErrors.lease_term && (
                <p className="mt-1 text-sm text-red-600">{formErrors.lease_term}</p>
              )}
            </div>
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Any special requests or information..."
              />
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 flex justify-end space-x-3">
            <Button
              type="button"
              onClick={() => setShowModal(false)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" className="mr-2" /> : null}
              Submit Booking
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Bookings;