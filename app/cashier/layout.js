// app/cashier/layout.js
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import Link from 'next/link';
import { FiLogOut } from 'react-icons/fi'; // Added for logout icon

// Minimal Navbar for Cashier
const CashierNavbar = () => {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-white text-gray-700 p-4 shadow-md fixed top-0 left-0 right-0 z-50 h-16 flex items-center">
      <div className="container mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <Link href="/cashier" className="text-xl font-bold text-indigo-600 hover:text-indigo-700">
          Sathi Mart - Cashier
        </Link>
        <div>
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.displayName || user.email?.split('@')[0]}
              </span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md text-sm inline-flex items-center transition-colors duration-150"
                title="Logout"
              >
                <FiLogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const CashierFooter = () => {
  return (
    <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600 border-t">
      © {new Date().getFullYear()} Sathi Mart. All rights reserved.
    </footer>
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <CashierNavbar />
      <main className="flex-1 pt-16"> {/* Adjusted pt for fixed navbar h-16 */}
        {children}
      </main>
      <CashierFooter />
    </div>
  );
}