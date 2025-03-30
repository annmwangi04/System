import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import NotFound from '../components/NotFound';

const MyHouse = () => {
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const { houseId } = useParams();

  useEffect(() => {
    const fetchHouseDetails = async () => {
      try {
        setLoading(true);
        // Get the house details
        const houseResponse = await axios.get(`/api/houses/${houseId}/`, {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`
          }
        });
        
        setHouse(houseResponse.data);
        
        // Get the invoices for this house
        const invoicesResponse = await axios.get(`/api/invoices/`, {
          params: { house_id: houseId },
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`
          }
        });
        
        setInvoices(invoicesResponse.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch house details');
        setLoading(false);
      }
    };

    fetchHouseDetails();
  }, [houseId]);

  const markInvoiceAsPaid = async (invoiceId) => {
    try {
      await axios.patch(`/api/invoices/${invoiceId}/`, 
        { paid: true },
        {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update the invoices state
      setInvoices(invoices.map(invoice => 
        invoice.id === invoiceId ? { ...invoice, paid: true } : invoice
      ));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update invoice');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !house) {
    return <NotFound message="House not found or you don't have permission to access it." />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">{house.apartment.name} - House {house.number}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">House Details</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p><span className="font-medium">Type:</span> {house.house_type.name}</p>
              <p><span className="font-medium">Status:</span> {house.status}</p>
              <p><span className="font-medium">Monthly Rent:</span> ${house.monthly_rent}</p>
              <p><span className="font-medium">Deposit:</span> ${house.deposit}</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-3">Apartment Details</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p><span className="font-medium">Location:</span> {house.apartment.location}</p>
              <p><span className="font-medium">Type:</span> {house.apartment.apartment_type.name}</p>
              <p><span className="font-medium">Owner:</span> {house.apartment.owner.first_name} {house.apartment.owner.last_name}</p>
              <p><span className="font-medium">Contact:</span> {house.apartment.owner.phone_number}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">My Invoices</h2>
        
        {invoices.length === 0 ? (
          <p className="text-gray-500">No invoices found for this house.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b text-left">Month</th>
                  <th className="py-2 px-4 border-b text-left">Year</th>
                  <th className="py-2 px-4 border-b text-left">Amount</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td className="py-2 px-4 border-b">{invoice.month}</td>
                    <td className="py-2 px-4 border-b">{invoice.year}</td>
                    <td className="py-2 px-4 border-b">${invoice.amount}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs ${invoice.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {invoice.paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      {!invoice.paid && (
                        <button
                          onClick={() => markInvoiceAsPaid(invoice.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyHouse;