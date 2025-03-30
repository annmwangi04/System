import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaymentPage = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  
  // For M-Pesa
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  
  // Fetch invoice details
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/invoices/${invoiceId}/`, {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`
          }
        });
        setInvoice(response.data);
        setAmount(response.data.amount_due.toString());
      } catch (error) {
        console.error('Error fetching invoice:', error);
        alert("Failed to fetch invoice details");
      } finally {
        setLoading(false);
      }
    };
    
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);
  
  // Handle payment
  const handlePayment = async () => {
    // Validate phone number for M-Pesa (Kenyan format)
    if (paymentMethod === 'mpesa') {
      const phoneRegex = /^(?:254|\+254|0)?(7[0-9]{8})$/;
      if (!phoneRegex.test(phoneNumber)) {
        setPaymentError('Please enter a valid Kenyan phone number');
        return;
      }
      
      // Format phone number to include country code for M-Pesa
      let formattedPhone = phoneNumber;
      if (phoneNumber.startsWith('0')) {
        formattedPhone = '254' + phoneNumber.substring(1);
      } else if (!phoneNumber.startsWith('254') && !phoneNumber.startsWith('+254')) {
        formattedPhone = '254' + phoneNumber;
      }
      
      try {
        setPaymentLoading(true);
        setPaymentError(null);
        
        // Initiate M-Pesa STK push
        const response = await axios.post('/api/payments/mpesa/initiate/', {
          phone_number: formattedPhone,
          amount: parseFloat(amount),
          invoice_id: invoiceId,
          account_reference: `Invoice-${invoiceId}`,
          transaction_desc: `Payment for ${invoice?.house?.apartment?.name} - House ${invoice?.house?.number}`
        }, {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          // Poll for payment status
          await checkPaymentStatus(response.data.checkout_request_id);
        } else {
          setPaymentError(response.data.message || 'Failed to initiate payment');
          setPaymentLoading(false);
        }
      } catch (error) {
        console.error('Payment error:', error);
        setPaymentError(error.response?.data?.error || 'Payment failed. Please try again.');
        setPaymentLoading(false);
      }
    } else {
      // Handle other payment methods if needed
      setPaymentError('Only M-Pesa payments are supported at the moment');
    }
  };
  
  // Poll for payment status
  const checkPaymentStatus = async (checkoutRequestId) => {
    try {
      let attempts = 0;
      const maxAttempts = 10;
      const interval = setInterval(async () => {
        attempts++;
        
        const statusResponse = await axios.get(`/api/payments/mpesa/status/${checkoutRequestId}/`, {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`
          }
        });
        
        if (statusResponse.data.success) {
          clearInterval(interval);
          setPaymentSuccess(true);
          setPaymentLoading(false);
          
          // Update invoice status
          await axios.patch(`/api/invoices/${invoiceId}/`, {
            paid: true,
            payment_date: new Date().toISOString(),
            payment_method: 'mpesa',
            transaction_id: statusResponse.data.transaction_id
          }, {
            headers: {
              'Authorization': `Token ${localStorage.getItem('token')}`
            }
          });
          
          alert("Payment completed successfully!");
          
          // Redirect after successful payment
          setTimeout(() => {
            navigate(`/dashboard/invoices/${invoiceId}`);
          }, 2000);
        } else if (statusResponse.data.error) {
          clearInterval(interval);
          setPaymentError(statusResponse.data.error);
          setPaymentLoading(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentError('Payment verification timed out. If funds were deducted, please contact support.');
          setPaymentLoading(false);
        }
      }, 3000); // Check every 3 seconds
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentError('Failed to verify payment status');
      setPaymentLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <span className="ml-2">Loading invoice details...</span>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">⚠️</div>
        <span className="ml-2">Invoice not found</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold">Pay Invoice #{invoice.id}</h3>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Invoice Details */}
          <div className="space-y-2 border-b pb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Property:</span>
              <span className="font-medium">{invoice.house?.apartment?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">House Number:</span>
              <span className="font-medium">{invoice.house?.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Period:</span>
              <span className="font-medium">{invoice.month}/{invoice.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Due:</span>
              <span className="font-medium text-lg">KES {invoice.amount_due.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Payment Form */}
          {!paymentSuccess && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="payment-method" className="block text-sm font-medium">Payment Method</label>
                <select
                  id="payment-method"
                  className="w-full p-2 border rounded-md"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={paymentLoading}
                >
                  <option value="mpesa">M-Pesa</option>
                </select>
              </div>
              
              {paymentMethod === 'mpesa' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="phone-number" className="block text-sm font-medium">M-Pesa Phone Number</label>
                    <input
                      id="phone-number"
                      type="tel"
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., 07XXXXXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={paymentLoading}
                    />
                    <p className="text-xs text-gray-500">
                      Format: 07XXXXXXXX or 254XXXXXXXXX
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="amount" className="block text-sm font-medium">Amount (KES)</label>
                    <input
                      id="amount"
                      type="number"
                      className="w-full p-2 border rounded-md"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={paymentLoading}
                    />
                  </div>
                </>
              )}
              
              {paymentError && (
                <div className="bg-red-50 p-3 rounded-md flex items-start">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <p className="text-sm text-red-600">{paymentError}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Payment Success Message */}
          {paymentSuccess && (
            <div className="bg-green-50 p-4 rounded-md flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <div>
                <h4 className="font-medium text-green-800">Payment Successful!</h4>
                <p className="text-sm text-green-600">Your payment has been processed successfully.</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex justify-between">
          <button
            className="px-4 py-2 border rounded-md hover:bg-gray-100"
            onClick={() => navigate('/dashboard/invoices')}
            disabled={paymentLoading}
          >
            Back to Invoices
          </button>
          
          {!paymentSuccess && (
            <button 
              className={`px-4 py-2 rounded-md text-white ${
                paymentLoading || !phoneNumber || !amount 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              onClick={handlePayment} 
              disabled={paymentLoading || !phoneNumber || !amount}
            >
              {paymentLoading ? (
                <>
                  <span className="inline-block h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  Processing...
                </>
              ) : (
                'Pay Now'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;