import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [tenantFilter, setTenantFilter] = useState('');
  const [houseFilter, setHouseFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [paidFilter, setPaidFilter] = useState('all');
  
  // Form states for adding new invoice
  const [newInvoice, setNewInvoice] = useState({
    house: '',
    tenant: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '',
    due_date: format(new Date().setDate(new Date().getDate() + 14), 'yyyy-MM-dd'),
    description: 'Monthly Rent',
    paid: false
  });
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Create headers with authentication token
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Token ${token}`
  };

  // Memoize the applyFilters function with useCallback
  const applyFilters = useCallback((invoiceList) => {
    let filtered = [...invoiceList];
    
    if (tenantFilter) {
      filtered = filtered.filter(invoice => 
        invoice.tenant_name && invoice.tenant_name.toLowerCase().includes(tenantFilter.toLowerCase())
      );
    }
    
    if (houseFilter) {
      filtered = filtered.filter(invoice => 
        invoice.house_number && invoice.house_number.toLowerCase().includes(houseFilter.toLowerCase())
      );
    }
    
    if (monthFilter) {
      filtered = filtered.filter(invoice => 
        invoice.month.toString() === monthFilter
      );
    }
    
    if (yearFilter) {
      filtered = filtered.filter(invoice => 
        invoice.year.toString() === yearFilter
      );
    }
    
    if (paidFilter !== 'all') {
      filtered = filtered.filter(invoice => 
        invoice.paid === (paidFilter === 'paid')
      );
    }
    
    setFilteredInvoices(filtered);
  }, [tenantFilter, houseFilter, monthFilter, yearFilter, paidFilter]);

  // Fetch all invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/invoices/', { headers });
      setInvoices(response.data);
      setFilteredInvoices(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch invoices');
      setLoading(false);
      console.error('Error fetching invoices:', err);
    }
  };

  // Add a new invoice
  const addInvoice = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/invoices/', newInvoice, { headers });
      const updatedInvoices = [...invoices, response.data];
      setInvoices(updatedInvoices);
      
      // Reset form
      setNewInvoice({
        house: '',
        tenant: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amount: '',
        due_date: format(new Date().setDate(new Date().getDate() + 14), 'yyyy-MM-dd'),
        description: 'Monthly Rent',
        paid: false
      });
    } catch (err) {
      setError('Failed to add invoice');
      console.error('Error adding invoice:', err);
    }
  };

  // Mark invoice as paid
  const markAsPaid = async (id) => {
    try {
      await axios.patch(`/api/invoices/${id}/`, { paid: true }, { headers });
      
      // Update the invoices list
      const updatedInvoices = invoices.map(invoice => 
        invoice.id === id ? { ...invoice, paid: true } : invoice
      );
      setInvoices(updatedInvoices);
    } catch (err) {
      setError('Failed to update invoice');
      console.error('Error updating invoice:', err);
    }
  };

  // Delete an invoice
  const deleteInvoice = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await axios.delete(`/api/invoices/${id}/`, { headers });
        
        // Update the invoices list
        const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
        setInvoices(updatedInvoices);
      } catch (err) {
        setError('Failed to delete invoice');
        console.error('Error deleting invoice:', err);
      }
    }
  };

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Apply filters when filter states or invoices change
  useEffect(() => {
    if (invoices.length > 0) {
      applyFilters(invoices);
    }
  }, [applyFilters, invoices]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewInvoice({
      ...newInvoice,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Property Rental Invoices</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Add New Invoice Form */}
      <div className="bg-white shadow-md rounded p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Invoice</h2>
        <form onSubmit={addInvoice}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">House ID</label>
              <input
                type="text"
                name="house"
                value={newInvoice.house}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Tenant ID</label>
              <input
                type="text"
                name="tenant"
                value={newInvoice.tenant}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Month</label>
              <select
                name="month"
                value={newInvoice.month}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                  <option key={month} value={month}>
                    {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Year</label>
              <input
                type="number"
                name="year"
                value={newInvoice.year}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                name="amount"
                value={newInvoice.amount}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                name="due_date"
                value={newInvoice.due_date}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={newInvoice.description}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
                rows="2"
              ></textarea>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="paid"
                checked={newInvoice.paid}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-gray-700">Already Paid</label>
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Add Invoice
          </button>
        </form>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow-md rounded p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filter Invoices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Tenant Name</label>
            <input
              type="text"
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Filter by tenant"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">House Number</label>
            <input
              type="text"
              value={houseFilter}
              onChange={(e) => setHouseFilter(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Filter by house"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Month</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">All Months</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                <option key={month} value={month}>
                  {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Year</label>
            <input
              type="text"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Filter by year"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Payment Status</label>
            <select
              value={paidFilter}
              onChange={(e) => setPaidFilter(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Invoices Table */}
      <div className="bg-white shadow-md rounded overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">House</th>
              <th className="px-4 py-2 text-left">Tenant</th>
              <th className="px-4 py-2 text-left">Month/Year</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Due Date</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-2 text-center">Loading invoices...</td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-2 text-center">No invoices found</td>
              </tr>
            ) : (
              filteredInvoices.map(invoice => (
                <tr key={invoice.id} className="border-t">
                  <td className="px-4 py-2">{invoice.house_number || invoice.house}</td>
                  <td className="px-4 py-2">{invoice.tenant_name || invoice.tenant}</td>
                  <td className="px-4 py-2">
                    {new Date(0, invoice.month - 1).toLocaleString('default', { month: 'long' })} {invoice.year}
                  </td>
                  <td className="px-4 py-2">${parseFloat(invoice.amount).toFixed(2)}</td>
                  <td className="px-4 py-2">{new Date(invoice.due_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <span 
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold
                        ${invoice.paid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {invoice.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {!invoice.paid && (
                      <button
                        onClick={() => markAsPaid(invoice.id)}
                        className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-sm mr-2"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => deleteInvoice(invoice.id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invoice;