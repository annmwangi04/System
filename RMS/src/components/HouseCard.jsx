import React, { useState } from 'react';
import axios from 'axios';

// Simple card components that don't rely on shadcn/ui
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-xl font-bold text-gray-800 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-t border-gray-200 ${className}`}>
    {children}
  </div>
);

// Simple button component
const Button = ({ children, onClick, className = "", variant = "default" }) => {
  const baseStyles = "px-4 py-2 rounded font-medium";
  const variantStyles = {
    default: "bg-blue-600 hover:bg-blue-700 text-white",
    outline: "border border-gray-300 hover:bg-gray-100 text-gray-800",
    destructive: "bg-red-600 hover:bg-red-700 text-white"
  };
  
  return (
    <button 
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// Simple badge component
const Badge = ({ children, variant = "default", className = "" }) => {
  const variantStyles = {
    default: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800"
  };
  
  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

const HouseCard = ({ house, onViewDetails, onEdit, onDelete, isAdmin = false }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this house?')) {
      setIsDeleting(true);
      try {
        await axios.delete(`/api/houses/${house.id}/`);
        onDelete(house.id);
      } catch (error) {
        console.error('Error deleting house:', error);
        alert('Failed to delete house. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'vacant':
        return <Badge variant="success">Vacant</Badge>;
      case 'occupied':
        return <Badge variant="danger">Occupied</Badge>;
      case 'maintenance':
        return <Badge variant="warning">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>House {house.number}</CardTitle>
      </CardHeader>
      
      {house.image && (
        <img 
          src={house.image} 
          alt={`House ${house.number}`} 
          className="h-48 w-full object-cover"
        />
      )}
      
      <CardContent className="flex-grow">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Status:</span>
            {getStatusBadge(house.status)}
          </div>
          
          <div>
            <span className="font-medium">Apartment:</span> {house.apartment.name}
          </div>
          
          <div>
            <span className="font-medium">Type:</span> {house.house_type.name}
          </div>
          
          <div>
            <span className="font-medium">Monthly Rent:</span> ${house.monthly_rent}
          </div>
          
          {house.deposit_amount && (
            <div>
              <span className="font-medium">Deposit:</span> ${house.deposit_amount}
            </div>
          )}
          
          {house.description && (
            <div>
              <span className="font-medium">Description:</span>
              <p className="text-gray-600 mt-1">{house.description}</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          onClick={() => onViewDetails(house)}
          variant="default"
        >
          View Details
        </Button>
        
        {isAdmin && (
          <div className="flex space-x-2">
            <Button 
              onClick={() => onEdit(house)}
              variant="outline"
            >
              Edit
            </Button>
            
            <Button 
              onClick={handleDelete}
              variant="destructive"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default HouseCard;