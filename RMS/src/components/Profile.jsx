import React from 'react';

const ProfileForm = ({ 
  isEditing, 
  formData, 
  roleProfile, 
  user, 
  loading, 
  onInputChange, 
  onSubmit, 
  onCancel 
}) => {
  if (isEditing) {
    return (
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={onInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={onInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={onInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phoneNumber">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={onInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="idNumber">
              ID Number/Passport
            </label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              value={formData.idNumber}
              onChange={onInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="physicalAddress">
              Physical Address
            </label>
            <input
              type="text"
              id="physicalAddress"
              name="physicalAddress"
              value={formData.physicalAddress}
              onChange={onInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Conditional fields for tenant */}
          {roleProfile && roleProfile.role === 'tenant' && (
            <>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="occupation">
                  Occupation
                </label>
                <select
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={onInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Occupation</option>
                  <option value="employed">Employed</option>
                  <option value="self_employed">Self-Employed</option>
                  <option value="student">Student</option>
                  <option value="retired">Retired</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="workplace">
                  Workplace/Company
                </label>
                <input
                  type="text"
                  id="workplace"
                  name="workplace"
                  value={formData.workplace}
                  onChange={onInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyContactPhone">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={onInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end mt-6 space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 focus:outline-none transition duration-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none transition duration-200"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
    );
  }

  // Display mode (not editing)
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-gray-700">Profile Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
        <div className="border-b md:border-b-0 md:border-r border-gray-200 pb-3 md:pb-0 md:pr-3">
          <p className="text-gray-600 text-sm">Full Name</p>
          <p className="font-medium">
            {user?.first_name || formData.firstName || 'Not provided'} {user?.last_name || formData.lastName || ''}
          </p>
        </div>
        
        <div className="border-b pb-3">
          <p className="text-gray-600 text-sm">Email Address</p>
          <p className="font-medium">{user?.email || formData.email || 'Not provided'}</p>
        </div>
        
        {roleProfile && (
          <>
            <div className="border-b md:border-b-0 md:border-r border-gray-200 pb-3 md:pb-0 md:pr-3">
              <p className="text-gray-600 text-sm">Phone Number</p>
              <p className="font-medium">{roleProfile.phone_number || formData.phoneNumber || 'Not provided'}</p>
            </div>
            
            <div className="border-b pb-3">
              <p className="text-gray-600 text-sm">ID/Passport Number</p>
              <p className="font-medium">
                {roleProfile.role === 'landlord' 
                  ? roleProfile.id_number || 'Not provided' 
                  : roleProfile.id_number_or_passport || 'Not provided'}
              </p>
            </div>
            
            <div className="border-b md:border-b-0 md:border-r border-gray-200 pb-3 md:pb-0 md:pr-3">
              <p className="text-gray-600 text-sm">Physical Address</p>
              <p className="font-medium">{roleProfile.physical_address || formData.physicalAddress || 'Not provided'}</p>
            </div>
            
            {roleProfile.role === 'tenant' && (
              <>
                <div className="border-b pb-3">
                  <p className="text-gray-600 text-sm">Occupation</p>
                  <p className="font-medium capitalize">{roleProfile.occupation || formData.occupation || 'Not provided'}</p>
                </div>
                
                <div className="border-b md:border-b-0 md:border-r border-gray-200 pb-3 md:pb-0 md:pr-3">
                  <p className="text-gray-600 text-sm">Workplace/Company</p>
                  <p className="font-medium">{roleProfile.workplace || formData.workplace || 'Not provided'}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 text-sm">Emergency Contact</p>
                  <p className="font-medium">{roleProfile.emergency_contact_phone || formData.emergencyContactPhone || 'Not provided'}</p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileForm;