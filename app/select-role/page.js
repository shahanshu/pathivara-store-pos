// app/select-role/page.js
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useEffect } from 'react';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

const SelectRolePage = () => {
  const router = useRouter();
  const { user, loading, logout, setRole, selectedRole } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && selectedRole) {
      if (selectedRole === 'admin') {
        router.push('/admin/dashboard');
      } else if (selectedRole === 'cashier') {
        router.push('/cashier');
      }
    }
  }, [user, loading, router, selectedRole]);

  const handleSelectRole = (role) => {
    setRole(role);
    if (role === 'admin') {
      router.push('/admin/dashboard');
    } else if (role === 'cashier') {
      router.push('/cashier');
    }
  };

  if (loading || (!loading && !user)) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-700 animate-pulse">Authenticating...</p>
      </div>
    );
  }

  if (selectedRole) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-700">Redirecting to your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6 text-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Session Expired</h2>
          <p className="text-gray-600 mb-6">Your session is not available. Please log in again.</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition duration-200 shadow-sm"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-10 rounded-2xl shadow-xl text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome back, <span className="text-indigo-600">{user.displayName || user.email.split('@')[0]}</span>!
        </h2>
        
        <p className="text-gray-600 mt-2">Where would you like to go today?</p>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={() => handleSelectRole('admin')}
            className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition duration-200 shadow-sm hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin Dashboard
          </button>
          
          <button
            onClick={() => handleSelectRole('cashier')}
            className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition duration-200 shadow-sm hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Cashier Point of Sale
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={logout}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium flex items-center justify-center mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectRolePage;