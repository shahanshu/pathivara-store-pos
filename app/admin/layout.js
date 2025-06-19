// app/admin/layout.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';

const AdminNavbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-gray-800 text-white p-2 sm:p-4 shadow-md fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 flex items-center">
      <div className="container mx-auto px-2 sm:px-4 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden mr-2 sm:mr-3 text-white hover:text-gray-300 focus:outline-none p-1"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
          <Link href="/admin/dashboard" className="text-base sm:text-xl font-semibold hover:text-gray-300 truncate max-w-[120px] sm:max-w-full">
            Admin Panel
          </Link>
        </div>
        <div>
          {user && (
            <div className="flex items-center">
              <span className="hidden md:inline mr-3 text-sm text-gray-300">
                Welcome, <span className="font-medium text-white">{user.displayName || user.email?.split('@')[0]}</span>
              </span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold text-xs sm:text-sm py-1.5 px-2 sm:py-2 sm:px-3 rounded transition-colors"
                aria-label="Logout"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside 
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-[80vw] max-w-[280px] sm:w-64 bg-gray-700 text-white p-3 sm:p-4 space-y-2 fixed left-0 top-14 sm:top-16 bottom-0 z-50 overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-lg`}
      >
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center justify-between">
          <span>Navigation</span>
          <button 
            onClick={toggleSidebar}
            className="lg:hidden text-white hover:text-gray-300 focus:outline-none p-1"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </h3>
        <div className="flex flex-col space-y-1">
          <Link href="/admin/dashboard" className="flex items-center text-sm sm:text-base py-2 px-3 rounded hover:bg-gray-600 transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/products" className="flex items-center text-sm sm:text-base py-2 px-3 rounded hover:bg-gray-600 transition-colors">
            Products
          </Link>
          <Link href="/admin/importers" className="flex items-center text-sm sm:text-base py-2 px-3 rounded hover:bg-gray-600 transition-colors">
            Importers
          </Link>
          <Link href="/admin/import-ledger" className="flex items-center text-sm sm:text-base py-2 px-3 rounded hover:bg-gray-600 transition-colors">
            Import Ledger
          </Link>
          <Link href="/admin/sales" className="flex items-center text-sm sm:text-base py-2 px-3 rounded hover:bg-gray-600 transition-colors">
            Sales Transactions
          </Link>
          <Link href="/admin/members" className="flex items-center text-sm sm:text-base py-2 px-3 rounded hover:bg-gray-600 transition-colors">
            Members
          </Link>
        </div>
      </aside>
    </>
  );
};

export default function AdminLayout({ children }) {
  const { user, loading, selectedRole } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar when route changes (mobile only) and when screen resizes to larger breakpoint
  useEffect(() => {
    const handleRouteChange = () => {
      setIsSidebarOpen(false);
    };
    
    // Close sidebar when screen resizes to desktop width
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsSidebarOpen(false);
      }
    };
    
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/admin/dashboard');
      } else if (selectedRole !== 'admin') {
        console.warn("User does not have admin role or role not selected. Redirecting.");
        router.push('/select-role');
      }
    }
  }, [user, loading, selectedRole, router]);

  if (loading || !user || selectedRole !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center p-6 sm:p-10 bg-white rounded-lg shadow-xl mx-4 sm:mx-auto">
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
  return (
    <div className="flex flex-col min-h-screen">
      <AdminNavbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1 pt-14 sm:pt-16">
        <AdminSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main className={`flex-1 p-3 sm:p-4 md:p-6 bg-gray-100 overflow-y-auto transition-all duration-300 ${
          isSidebarOpen ? 'ml-0 lg:ml-64' : 'ml-0 lg:ml-64'
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
}