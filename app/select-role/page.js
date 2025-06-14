// app/select-role/page.js
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useEffect } from 'react';
import LoadingSpinner from '@/app/components/common/LoadingSpinner'; // Assuming you have this

const SelectRolePage = () => {
  const router = useRouter();
  const { user, loading, logout, setRole, selectedRole } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // If a role is already selected and user is on this page, redirect them
    // This handles cases where user might navigate back to /select-role
    if (!loading && user && selectedRole) {
      if (selectedRole === 'admin') {
        router.push('/admin/dashboard');
      } else if (selectedRole === 'cashier') {
        router.push('/cashier'); // Updated redirect for cashier
      }
    }
  }, [user, loading, router, selectedRole]);


  const handleSelectRole = (role) => {
    setRole(role); // Set the role in context
    if (role === 'admin') {
      router.push('/admin/dashboard');
    } else if (role === 'cashier') {
      router.push('/cashier'); // Updated redirect for cashier
    }
  };

  if (loading || (!loading && !user)) { // Simplified loading condition
    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-700">Loading...</p>
        </div>
    );
  }

  // If a role is already selected, don't show the selection page (handled by useEffect redirect)
  // This is a fallback if the useEffect redirect hasn't fired yet.
  if (selectedRole) {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-700">Redirecting...</p>
        </div>
    );
  }

  // Ensure user is loaded before trying to display user.email
  if (!user) {
      // This case should ideally be covered by the loading condition above,
      // but as a fallback if user is null after loading.
      return (
          <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
              <p className="mt-4 text-gray-700">User data not available. Please try logging in again.</p>
              <button
                  onClick={() => router.push('/login')}
                  className="mt-4 w-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                  Go to Login
              </button>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome, {user.displayName || user.email}!</h2>
        <p className="text-gray-600">Please select your role to continue:</p>
        <div className="mt-6 space-y-4">
          <button
            onClick={() => handleSelectRole('admin')}
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Admin Dashboard
          </button>
          <button
            onClick={() => handleSelectRole('cashier')}
            className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cashier Panel {/* Updated button text */}
          </button>
        </div>
        <div className="mt-8">
            <button
              onClick={logout}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Sign out
            </button>
        </div>
      </div>
    </div>
  );
};

export default SelectRolePage;