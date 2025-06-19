// app/components/cashier/RegisterMemberForCheckoutModal.jsx
'use client';
import React, { useState } from 'react';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiUserPlus, FiX } from 'react-icons/fi';
import { useEffect } from 'react';
export default function RegisterMemberForCheckoutModal({
  isOpen,
  onClose,
  onRegisterAndProceed, // Renamed for clarity
  initialPhoneNumber = ""
}) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { // Sync phone number if initial prop changes
    setPhoneNumber(initialPhoneNumber);
  }, [initialPhoneNumber]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError('A valid 10-digit phone number is required.');
      return;
    }
    setIsRegistering(true);
    try {
      await onRegisterAndProceed(name, phoneNumber);
      // Parent will handle closing the modal on success
    } catch (registrationError) {
      setError(registrationError.message || 'Failed to register member. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-[150] flex justify-center items-center p-4">
      <div className="relative bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full"
          title="Close"
          disabled={isRegistering}
        >
          <FiX size={24} />
        </button>
        
        <div className="text-center mb-6">
          <FiUserPlus className="mx-auto h-12 w-12 text-indigo-500 mb-3" />
          <h3 className="text-xl font-semibold text-gray-800">Register New Member</h3>
          <p className="text-sm text-gray-500 mt-1">
            The customer is not a member. Register them to proceed.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="checkout-member-name" className="block text-sm font-medium text-gray-700">
              Member Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="checkout-member-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter full name"
              required
              disabled={isRegistering}
            />
          </div>
          <div>
            <label htmlFor="checkout-member-phone" className="block text-sm font-medium text-gray-700">
              Phone Number (10 digits) <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="checkout-member-phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter 10-digit phone number"
              maxLength={10}
              required
              disabled={isRegistering}
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={isRegistering}
              className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-md shadow-md transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isRegistering ? <LoadingSpinner size="sm" color="text-white mr-2" /> : <FiUserPlus className="mr-2 h-5 w-5" />}
              {isRegistering ? 'Registering...' : 'Register & Proceed to Checkout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}