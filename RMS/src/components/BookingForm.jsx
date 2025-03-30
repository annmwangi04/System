import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookingForm = ({ booking, onSubmit, onCancel }) => {
    const [houses, setHouses] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [formData, setFormData] = useState({
        house: '',
        tenant: '',
        deposit_amount: '',
        rent_amount_paid: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [housesResponse, tenantsResponse] = await Promise.all([
                    axios.get('/api/houses/?status=vacant'),
                    axios.get('/api/tenants/')
                ]);
                
                setHouses(housesResponse.data);
                setTenants(tenantsResponse.data);
                
                if (booking) {
                    setFormData({
                        house: booking.house.id,
                        tenant: booking.tenant.id,
                        deposit_amount: booking.deposit_amount,
                        rent_amount_paid: booking.rent_amount_paid
                    });
                }
                
                setLoading(false);
            } catch (err) {
                console.error("Error fetching form data:", err);
                setError("Failed to load form data. Please try again.");
                setLoading(false);
            }
        };

        fetchData();
    }, [booking]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Convert numeric values
        if (name === 'deposit_amount' || name === 'rent_amount_paid') {
            setFormData({
                ...formData,
                [name]: parseFloat(value) || ''
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (loading) return <div className="text-center p-6">Loading form...</div>;

    return (
        <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">
                {booking ? 'Edit Booking' : 'New Booking'}
            </h2>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            House
                        </label>
                        <select
                            name="house"
                            value={formData.house}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded"
                        >
                            <option value="">Select House</option>
                            {houses.map(house => (
                                <option key={house.id} value={house.id}>
                                    {house.number} - {house.apartment.name} (${house.monthly_rent}/month)
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tenant
                        </label>
                        <select
                            name="tenant"
                            value={formData.tenant}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded"
                        >
                            <option value="">Select Tenant</option>
                            {tenants.map(tenant => (
                                <option key={tenant.id} value={tenant.id}>
                                    {tenant.user?.first_name} {tenant.user?.last_name} - ID: {tenant.id_number_or_passport}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deposit Amount ($)
                        </label>
                        <input
                            type="number"
                            name="deposit_amount"
                            value={formData.deposit_amount}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rent Amount Paid ($)
                        </label>
                        <input
                            type="number"
                            name="rent_amount_paid"
                            value={formData.rent_amount_paid}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        {booking ? 'Update Booking' : 'Create Booking'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BookingForm;