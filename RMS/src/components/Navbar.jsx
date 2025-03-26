import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for user in localStorage on component mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogout = () => {
    // Remove user from localStorage
    localStorage.removeItem('user');
    // Update state
    setUser(null);
    // Redirect to login page
    navigate('/login');
  };

  return (
    <nav className="navbar bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rental Management</h1>
        <ul className="flex space-x-4 items-center">
          {/* Always visible links */}
          <li><Link to="/" className="hover:text-gray-300">Home</Link></li>

          {/* Unauthenticated user links */}
          {!user && (
            <>
              <li><Link to="/login" className="hover:text-gray-300">Login</Link></li>
              <li><Link to="/signup" className="hover:text-gray-300">Sign Up</Link></li>
            </>
          )}

          {/* Landlord-specific links */}
          {user && user.role === 'landlord' && (
            <>
              <li><Link to="/dashboard/landlord" className="hover:text-gray-300">Dashboard</Link></li>
              <li><Link to="/houses" className="hover:text-gray-300">Houses</Link></li>
              <li><Link to="/invoices" className="hover:text-gray-300">Invoices</Link></li>
            </>
          )}

          {/* Tenant-specific links */}
          {user && user.role === 'tenant' && (
            <>
              <li><Link to="/dashboard/tenant" className="hover:text-gray-300">Dashboard</Link></li>
              <li><Link to="/bookings" className="hover:text-gray-300">Bookings</Link></li>
            </>
          )}

          {/* Logout button for authenticated users */}
          {user && (
            <li>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition duration-300"
              >
                Logout
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;