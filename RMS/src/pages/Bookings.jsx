import { useState, useEffect } from "react";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/bookings/");
        if (!response.ok) {
          throw new Error("Failed to fetch bookings");
        }
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">House Bookings</h1>

      {loading ? (
        <p className="text-center text-gray-600">Loading bookings...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Tenant</th>
                <th className="py-3 px-6 text-left">House</th>
                <th className="py-3 px-6 text-left">Booking Date</th>
                <th className="py-3 px-6 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6">{booking.tenant_name}</td>
                    <td className="py-3 px-6">{booking.house_name}</td>
                    <td className="py-3 px-6">{new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td className="py-3 px-6">
                      <span
                        className={`px-2 py-1 rounded text-white ${
                          booking.status === "Confirmed" ? "bg-green-500" : "bg-yellow-500"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-3 px-6 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Bookings;
