// app/admin/layout.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';

// AdminNavbar and AdminSidebar components remain the same as before

const AdminNavbar = () => { /* ... same as before ... */
  const { user, logout } = useAuth();
  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md fixed top-0 left-0 right-0 z-50 h-16 flex items-center"> {/* Ensure fixed height */}
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/admin/dashboard" className="text-xl font-semibold hover:text-gray-300">
          Admin Panel
        </Link>
        <div>
          {user && (
            <>
              <span className="mr-4">Welcome, {user.displayName || user.email}</span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm" // Adjusted padding
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

const AdminSidebar = () => { /* ... same as before ... */
  return (
    <aside className="w-64 bg-gray-700 text-white p-4 space-y-2 fixed left-0 top-16 bottom-0 overflow-y-auto"> {/* Adjusted for fixed navbar */}
      <h3 className="text-lg font-semibold mb-3">Navigation</h3>
      <Link href="/admin/dashboard" className="block py-2 px-3 rounded hover:bg-gray-600">
        Dashboard
      </Link>
      <Link href="/admin/products" className="block py-2 px-3 rounded hover:bg-gray-600">
        Products
      </Link>
      <Link href="/admin/importers" className="block py-2 px-3 rounded hover:bg-gray-600">
        Importers
      </Link>
      <Link href="/admin/import-ledger" className="block py-2 px-3 rounded hover:bg-gray-600">
        Import Ledger
      </Link>
      <Link href="/admin/sales" className="block py-2 px-3 rounded hover:bg-gray-600">
        Sales Transactions
      </Link>
      {/* Add more admin links here */}
    </aside>
  );
};


export default function AdminLayout({ children }) {
  const { user, loading, selectedRole } = useAuth(); // Add selectedRole
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/admin/dashboard');
      } else if (selectedRole !== 'admin') {
        // If logged in but role is not admin (or not set), redirect to role selection
        // This prevents direct navigation to /admin/* if role isn't 'admin'
        console.warn("User does not have admin role or role not selected. Redirecting.");
        router.push('/select-role');
      }
    }
  }, [user, loading, selectedRole, router]);

  if (loading || !user || selectedRole !== 'admin') {
    // Show a loading/unauthorized message while checking or if unauthorized
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center p-10 bg-white rounded-lg shadow-xl">
            <svg className="mx-auto h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
                {loading ? 'Authenticating...' : 'Access Denied'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
                {loading ? 'Please wait while we verify your credentials.' : 'You do not have permission to view this page or your session is invalid.'}
            </p>
            {!loading && !user && (
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Go to Login
                    </button>
                </div>
            )}
             {!loading && user && selectedRole !== 'admin' && (
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={() => router.push('/select-role')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Select Role
                    </button>
                </div>
            )}
        </div>
      </div>
    );
  }

  // User is authenticated and has admin role selected
  return (
    <div className="flex flex-col min-h-screen">
      <AdminNavbar />
      <div className="flex flex-1 pt-16"> {/* Ensure this matches navbar height */}
        <AdminSidebar />
        <main className="flex-1 p-6 ml-64 bg-gray-100 overflow-y-auto"> {/* Ensure ml matches sidebar width */}
          {children}
        </main>
      </div>
    </div>
  );
}