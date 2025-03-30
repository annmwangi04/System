import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = ({ message, redirectTo, redirectText }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 p-6 text-center">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
        <div className="text-red-500 mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Not Found</h1>
        
        <p className="text-gray-600 mb-6">
          {message || "The resource you're looking for doesn't exist or you don't have permission to access it."}
        </p>
        
        <div className="flex justify-center space-x-4">
          <Link to={redirectTo || "/"} className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded">
            {redirectText || "Back to Home"}
          </Link>
          
          <button 
            onClick={() => window.history.back()} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;