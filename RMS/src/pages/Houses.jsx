import { useState, useEffect } from "react";
import HouseCard from "../components/HouseCard";

const Houses = () => {
  const [houses, setHouses] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/houses/")
      .then((response) => response.json())
      .then((data) => setHouses(data))
      .catch((error) => console.error("Error fetching houses:", error));
  }, []);

  return (
    <div>
      <h1>Available Houses</h1>
      <div className="house-container">
        {houses.length > 0 ? (
          houses.map((house) => <HouseCard key={house.id} house={house} />)
        ) : (
          <p>No houses available.</p>
        )}
      </div>
    </div>
  );
};

export default Houses;
