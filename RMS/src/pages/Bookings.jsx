import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookingForm from '../components/BookingForm';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/bookings/');
            setBookings(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching bookings:", err);
            setError("Failed to load bookings. Please try again later.");
            setLoading(false);
        }
    };

    const handleAddBooking = () => {
        setSelectedBooking(null);
        setShowForm(true);
    };

    const handleEditBooking = (booking) => {
        setSelectedBooking(booking);
        setShowForm(true);
    };

    const handleDeleteBooking = async (bookingId) => {
        if (window.confirm("Are you sure you want to delete this booking?")) {
            try {
                await axios.delete(`/api/bookings/${bookingId}/`);
                fetchBookings();
            } catch (err) {
                console.error("Error deleting booking:", err);
                setError("Failed to delete booking. Please try again.");
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (selectedBooking) {
                await axios.put(`/api/bookings/${selectedBooking.id}/`, formData);
            } else {
                await axios.post('/api/bookings/', formData);
            }
            setShowForm(false);
            fetchBookings();
        } catch (err) {
            console.error("Error saving booking:", err);
            setError("Failed to save booking. Please check your input and try again.");
        }
    };

    const handleFormCancel = () => {
        setShowForm(false);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) return <div className="text-center p-6">Loading bookings...</div>;

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">House Bookings</h1>
                <button
                    onClick={handleAddBooking}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Add New Booking
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {showForm && (
                <div className="mb-6">
                    <BookingForm
                        booking={selectedBooking}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                    />
                </div>
            )}

            {bookings.length === 0 ? (
                <div className="text-center p-6 bg-gray-100 rounded">
                    No bookings found. Add a new booking to get started.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 border-b text-left">House</th>
                                <th className="py-3 px-4 border-b text-left">Tenant</th>
                                <th className="py-3 px-4 border-b text-left">Deposit</th>
                                <th className="py-3 px-4 border-b text-left">Rent Paid</th>
                                <th className="py-3 px-4 border-b text-left">Date Added</th>
                                <th className="py-3 px-4 border-b text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 border-b">
                                        {booking.house.number} - {booking.house.apartment.name}
                                    </td>
                                    <td className="py-3 px-4 border-b">
                                        {booking.tenant.user?.first_name} {booking.tenant.user?.last_name}
                                    </td>
                                    <td className="py-3 px-4 border-b">
                                        ${booking.deposit_amount.toFixed(2)}
                                    </td>
                                    <td className="py-3 px-4 border-b">
                                        ${booking.rent_amount_paid.toFixed(2)}
                                    </td>
                                    <td className="py-3 px-4 border-b">
                                        {formatDate(booking.date_added)}
                                    </td>
                                    <td className="py-3 px-4 border-b">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditBooking(booking)}
                                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBooking(booking.id)}
                                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Bookings;