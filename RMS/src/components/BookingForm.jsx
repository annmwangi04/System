import { useState } from "react";

const BookingForm = () => {
  const [formData, setFormData] = useState({
    tenant_name: "",
    house_id: "",
    booking_date: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/bookings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit booking");
      }

      setMessage("Booking submitted successfully!");
      setFormData({ tenant_name: "", house_id: "", booking_date: "" });
    } catch (error) {
      setMessage("Error submitting booking. Please try again.");
      console.error("Booking error:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Book a House</h2>
      {message && <p className="text-green-600 mb-3">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Tenant Name:</label>
          <input
            type="text"
            name="tenant_name"
            value={formData.tenant_name}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded mt-1"
          />
        </div>

        <div>
          <label className="block text-gray-700">House ID:</label>
          <input
            type="text"
            name="house_id"
            value={formData.house_id}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded mt-1"
          />
        </div>

        <div>
          <label className="block text-gray-700">Booking Date:</label>
          <input
            type="date"
            name="booking_date"
            value={formData.booking_date}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded mt-1"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Submit Booking
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
