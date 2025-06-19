// app/components/cashier/CustomerLookup.jsx
'use client';
import { FiUsers, FiSearch, FiUserPlus } from 'react-icons/fi'; // Added FiUserPlus
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import React, { useState } from 'react'; // Added useState for local form state

export default function CustomerLookup({
  customerPhoneNumber,
  setCustomerPhoneNumber,
  onLookupMember,
  isLookingUpMember,
  memberLookupError,
  currentMember,
  onClearMember,
  isCheckingOut,
  isLoadingProduct,
  // --- Props for lookup-initiated registration ---
  showRegisterMemberForm,    // Controlled by CashierPage
  onRegisterMemberFromLookup, // New handler prop from CashierPage
  memberName,                // For the registration form's name field
  setMemberName,             // To update the name field
  isRegisteringMember,       // Loading state for this specific registration
  onCancelRegistration       // To hide the form
}) {
  
  const handleRegistrationSubmit = (e) => {
    e.preventDefault();
    if (onRegisterMemberFromLookup) {
      onRegisterMemberFromLookup(memberName, customerPhoneNumber); // Use current customerPhoneNumber
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <div className="flex items-center mb-3">
        <FiUsers className="h-6 w-6 text-indigo-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Customer Membership</h3>
      </div>
      
      {!currentMember ? (
        <>
          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (10 digits)
            </label>
            <div className="flex">
              <input
                type="tel"
                id="customerPhone"
                value={customerPhoneNumber}
                onChange={(e) => setCustomerPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit phone"
                className="flex-grow w-full px-4 py-3 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-150"
                maxLength={10}
                disabled={isLookingUpMember || isCheckingOut || isLoadingProduct || showRegisterMemberForm} // Disable if reg form is shown
              />
              <button
                onClick={onLookupMember}
                disabled={isLookingUpMember || !customerPhoneNumber || customerPhoneNumber.length < 10 || isCheckingOut || isLoadingProduct || showRegisterMemberForm}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-r-md disabled:opacity-50 flex items-center justify-center min-w-[100px] transition-colors duration-150"
              >
                {isLookingUpMember ? <LoadingSpinner size="sm" color="text-white" /> : <FiSearch size={20} />}
                <span className="ml-2 hidden sm:inline">Lookup</span>
              </button>
            </div>
          </div>
          
          {memberLookupError && !isLookingUpMember && (
            <p className={`mt-2 text-sm ${showRegisterMemberForm ? 'text-orange-600' : 'text-red-600'}`}>
                {memberLookupError}
            </p>
          )}

          {/* Registration form shown after lookup if member not found */}
          {showRegisterMemberForm && !isLookingUpMember && (
            <form onSubmit={handleRegistrationSubmit} className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              <p className="text-sm font-medium text-gray-700">Register New Member:</p>
              <div>
                <label htmlFor="lookup-member-name" className="block text-xs font-medium text-gray-600">
                  Member Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lookup-member-name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter full name"
                  required
                  disabled={isRegisteringMember || isCheckingOut || isLoadingProduct}
                />
              </div>
              {/* Phone number is taken from customerPhoneNumber state, display as read-only or confirm */}
              <div>
                 <label className="block text-xs font-medium text-gray-600">Phone Number (to register)</label>
                 <p className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 sm:text-sm text-gray-700">
                    {customerPhoneNumber}
                 </p>
              </div>
              <div className="flex space-x-2 pt-1">
                <button
                  type="submit"
                  disabled={isRegisteringMember || !memberName.trim() || isCheckingOut || isLoadingProduct}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-md shadow disabled:opacity-70 flex items-center justify-center"
                >
                  {isRegisteringMember ? <LoadingSpinner size="xs" color="text-white mr-2" /> : <FiUserPlus className="mr-1.5 h-4 w-4" />}
                  {isRegisteringMember ? 'Registering...' : 'Register Member'}
                </button>
                <button
                  type="button"
                  onClick={onCancelRegistration} // Prop to call clearMemberInfo or similar
                  disabled={isRegisteringMember}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-md shadow"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <div className="p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
          <p className="font-medium text-sm">Member: {currentMember.name}</p>
          <p className="text-xs">Phone: {currentMember.phoneNumber}</p>
          <button
            onClick={onClearMember}
            disabled={isCheckingOut || isLoadingProduct}
            className="mt-2 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium"
          >
            Clear Member / Different Customer
          </button>
        </div>
      )}
    </div>
  );
}