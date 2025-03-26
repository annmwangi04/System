const HouseCard = ({ house }) => {
  return (
    <div className="house-card">
      <h3>{house.name}</h3>
      <p>Price: ${house.rent}</p>
      <p>Location: {house.location}</p>
      <button>Book Now</button>
    </div>
  );
};

export default HouseCard;
