// app/cashier/layout.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner'; // Assuming you have this
import Link from 'next/link';

// Minimal Navbar for Cashier
const CashierNavbar = () => {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-green-600 text-white p-3 shadow-md fixed top-0 left-0 right-0 z-50 h-16 flex items-center">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link href="/cashier" className="text-xl font-semibold hover:text-green-100">
          Sathi Mart - Cashier
        </Link>
        <div>
          {user && (
            <>
              <span className="mr-3 text-sm">Welcome, {user.displayName || user.email?.split('@')[0]}</span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default function CashierLayout({ children }) {
  const { user, loading, selectedRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/cashier');
      } else if (selectedRole !== 'cashier' && selectedRole !== 'admin') {
        // Admins can also access cashier for testing/override
        console.warn("User does not have cashier role or role not selected. Redirecting.");
        router.push('/select-role');
      }
    }
  }, [user, loading, selectedRole, router]);

  if (loading || !user || (selectedRole !== 'cashier' && selectedRole !== 'admin')) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-700">
          {loading ? 'Authenticating...' : 'Redirecting...'}
        </p>
        {!loading && !user && (
          <p className="mt-2 text-sm text-gray-500">Please log in to access the cashier panel.</p>
        )}
        {!loading && user && (selectedRole !== 'cashier' && selectedRole !== 'admin') && (
            <p className="mt-2 text-sm text-gray-500">You do not have the required role.</p>
        )}
      </div>
    );
  }

  // User is authenticated and has the cashier (or admin) role selected
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <CashierNavbar />
      <main className="flex-1 pt-20 px-4 pb-4 md:px-6"> {/* Adjusted pt for fixed navbar h-16 + padding */}
        {children}
      </main>
    </div>
  );
}