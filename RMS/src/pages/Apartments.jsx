import { useState, useEffect } from "react";

const Apartments = () => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/apartments/");
        if (!response.ok) {
          throw new Error("Failed to fetch apartments");
        }
        const data = await response.json();
        setApartments(data);
      } catch (error) {
        console.error("Error fetching apartments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApartments();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Available Apartments</h1>

      {loading ? (
        <p className="text-center text-gray-600">Loading apartments...</p>
      ) : (
        <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
          {apartments.length > 0 ? (
            apartments.map((apartment) => (
              <div key={apartment.id} className="bg-white p-5 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700">{apartment.name}</h2>
                <p className="text-gray-500">{apartment.location}</p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Type:</strong> {apartment.apartment_type}
                </p>
                <p className="text-sm mt-2">
                  <span className={`px-2 py-1 rounded text-white ${apartment.is_available ? "bg-green-500" : "bg-red-500"}`}>
                    {apartment.is_available ? "Available" : "Not Available"}
                  </span>
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">No apartments available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Apartments;
