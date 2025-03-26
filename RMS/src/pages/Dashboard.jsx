import { useState, useEffect } from "react";

const Dashboard = () => {
  const [houses, setHouses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const housesResponse = await fetch("http://127.0.0.1:8000/api/houses/");
        const bookingsResponse = await fetch("http://127.0.0.1:8000/api/bookings/");
        const invoicesResponse = await fetch("http://127.0.0.1:8000/api/invoices/");

        const housesData = await housesResponse.json();
        const bookingsData = await bookingsResponse.json();
        const invoicesData = await invoicesResponse.json();

        setHouses(housesData);
        setBookings(bookingsData);
        setInvoices(invoicesData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Dashboard</h1>

      {/* Dashboard Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Houses Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold text-gray-700">🏠 Houses</h2>
          <p className="text-4xl font-bold text-blue-500 mt-2">{houses.length}</p>
          <p className="text-gray-500">Total Houses</p>
        </div>

        {/* Bookings Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold text-gray-700">📅 Bookings</h2>
          <p className="text-4xl font-bold text-green-500 mt-2">{bookings.length}</p>
          <p className="text-gray-500">Total Bookings</p>
        </div>

        {/* Invoices Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold text-gray-700">🧾 Invoices</h2>
          <p className="text-4xl font-bold text-red-500 mt-2">{invoices.length}</p>
          <p className="text-gray-500">Total Invoices</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;