import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // This was incorrectly imported from '@/components/ui/card'
import { Badge } from '@/components/ui/badge';
import { Building, Home, MapPin, User } from 'lucide-react';

const ApartmentCard = ({ apartment, onViewDetails, onEditApartment, isLandlord = false }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Format date string to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      setIsLoading(true); // Set loading state when clicking the button
      try {
        onViewDetails(apartment);
      } finally {
        setIsLoading(false); // Reset loading state
      }
    }
  };

  const handleEditApartment = () => {
    if (onEditApartment) {
      setIsLoading(true); // Set loading state when clicking the button
      try {
        onEditApartment(apartment);
      } finally {
        setIsLoading(false); // Reset loading state
      }
    }
  };

  // Calculate available houses if the apartment has houses
  const getAvailableHouses = () => {
    if (!apartment.houses) return 0;
    return apartment.houses.filter(house => house.status === 'vacant').length;
  };

  return (
    <Card className="w-full max-w-md overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Image Section */}
      <div className="relative w-full h-48 overflow-hidden">
        {apartment.image_url ? (
          <img 
            src={apartment.image_url} 
            alt={`${apartment.name}`} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "/api/placeholder/400/200"; // Fallback placeholder if image fails to load
              e.target.alt = "Image not available";
            }}
          />
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
            <Building size={48} className="text-slate-400" />
          </div>
        )}
      </div>
      
      <CardHeader className="bg-slate-50 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold text-slate-800">{apartment.name}</CardTitle>
          <Badge variant={getAvailableHouses() > 0 ? "success" : "secondary"} className="px-2 py-1">
            {getAvailableHouses()} Available
          </Badge>
        </div>
        <CardDescription className="text-sm text-slate-500">
          Added on {formatDate(apartment.date_added)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-slate-400" />
            <span className="text-sm">{apartment.location || 'Location not specified'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Building size={16} className="text-slate-400" />
            <span className="text-sm">
              {apartment.apartment_type ? apartment.apartment_type.name : 'Type not specified'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Home size={16} className="text-slate-400" />
            <span className="text-sm">
              {apartment.houses ? `${apartment.houses.length} Units` : '0 Units'}
            </span>
          </div>
          
          {apartment.owner && (
            <div className="flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              <span className="text-sm">
                {`${apartment.owner.first_name || ''} ${apartment.owner.middle_name || ''}`}
              </span>
            </div>
          )}
          
          <p className="text-sm mt-2 text-slate-600 line-clamp-2">
            {apartment.description || 'No description available'}
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 bg-slate-50">
        <Button
          variant="outline"
          onClick={handleViewDetails}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "View Details"}
        </Button>
        
        {isLandlord && (
          <Button
            variant="default"
            onClick={handleEditApartment}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Edit"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ApartmentCard;