import React, { useState, useEffect } from 'react';
import ApartmentCard from './ApartmentCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Search } from 'lucide-react';

const ApartmentList = ({ isLandlord = false }) => {
  const [apartments, setApartments] = useState([]);
  const [filteredApartments, setFilteredApartments] = useState([]);
  const [apartmentTypes, setApartmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Fetch apartments and apartment types on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch apartment types
        const typesResponse = await fetch('/api/apartment-types/', {
          headers: {
            'Content-Type': 'application/json',
            // If using token auth
            'Authorization': `Token ${localStorage.getItem('authToken')}` 
          }
        });
        
        if (!typesResponse.ok) throw new Error('Failed to fetch apartment types');
        const typesData = await typesResponse.json();
        setApartmentTypes(typesData);
        
        // Create URL with query params if landlord
        let url = '/api/apartments/';
        if (isLandlord) {
          // Assuming the backend knows the current user and can filter accordingly
          // or you have the landlord ID stored somewhere
          const landlordId = localStorage.getItem('landlordId');
          if (landlordId) {
            url += `?owner_id=${landlordId}`;
          }
        }
        
        // Fetch apartments
        const apartmentsResponse = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${localStorage.getItem('authToken')}`
          }
        });
        
        if (!apartmentsResponse.ok) throw new Error('Failed to fetch apartments');
        const apartmentsData = await apartmentsResponse.json();
        
        // Ensure each apartment has an image_url property
        const processedApartments = apartmentsData.map(apt => ({
          ...apt,
          // If the API already provides image_url, this won't overwrite it
          // If it doesn't, this creates a default based on the apartment ID
          image_url: apt.image_url || apt.featured_image || `/api/apartments/${apt.id}/image`
        }));
        
        setApartments(processedApartments);
        setFilteredApartments(processedApartments);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isLandlord]);

  // Apply filters when searchTerm or typeFilter changes
  useEffect(() => {
    let results = apartments;
    
    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      results = results.filter(apt => 
        (apt.name && apt.name.toLowerCase().includes(lowerCaseSearch)) ||
        (apt.location && apt.location.toLowerCase().includes(lowerCaseSearch)) ||
        (apt.description && apt.description.toLowerCase().includes(lowerCaseSearch))
      );
    }
    
    // Apply type filter
    if (typeFilter) {
      results = results.filter(apt => 
        apt.apartment_type && apt.apartment_type.id.toString() === typeFilter
      );
    }
    
    setFilteredApartments(results);
  }, [searchTerm, typeFilter, apartments]);
  
  const handleViewDetails = (apartment) => {
    // Simply navigate to the details page
    // The ApartmentCard component handles its own loading state
    window.location.href = `/dashboard/apartments/${apartment.id}`;
  };
  
  const handleEditApartment = (apartment) => {
    // Simply navigate to the edit page
    // The ApartmentCard component handles its own loading state
    window.location.href = `/dashboard/apartments/${apartment.id}/edit`;
  };
  
  if (loading) return <div className="text-center py-10">Loading apartments...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search apartments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="w-full md:w-60">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All apartment types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All apartment types</SelectItem>
              {apartmentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Building size={16} />
                    <span>{type.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredApartments.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          No apartments found. {isLandlord && "Create your first apartment!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApartments.map((apartment) => (
            <ApartmentCard
              key={apartment.id}
              apartment={apartment}
              onViewDetails={handleViewDetails}
              onEditApartment={handleEditApartment}
              isLandlord={isLandlord}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ApartmentList;