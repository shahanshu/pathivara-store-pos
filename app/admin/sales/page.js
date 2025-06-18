// File: app/admin/sales/page.js

'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiCalendar, FiDollarSign, FiShoppingCart, FiTrendingUp, FiArrowLeft, FiArrowRight, FiFileText, FiRefreshCw } from 'react-icons/fi';

// Helper to format date (YYYY-MM-DD for input fields)
const formatDateForInput = (date) => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

// Helper to format date for display (e.g., Jun 16, 2024)
const formatDateDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  // Add 'T00:00:00' to ensure date is parsed in local timezone consistently
  return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString([], {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'NPR',
        minimumFractionDigits: 2,
    }).format(amount || 0);
};


// --- Phase 3: Chart Component ---
const SimpleDailySalesChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">No daily sales data to display for the selected period.</div>;
  }
  
  const maxRevenue = Math.max(...data.map(d => d.totalRevenue), 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Sales Trend (Revenue)</h3>
      <div className="flex items-end h-64 space-x-2 overflow-x-auto pb-2 pr-2 border-l border-b border-gray-200">
        {data.map(day => (
          <div key={day.date} className="flex flex-col items-center flex-shrink-0 w-16" title={`${formatDateDisplay(day.date)}: ${formatCurrency(day.totalRevenue)}`}>
            <div
              className="w-8 bg-blue-500 hover:bg-blue-600 transition-colors rounded-t-md"
              style={{ height: `${maxRevenue > 0 ? (day.totalRevenue / maxRevenue) * 100 : 0}%` }}
            ></div>
            <span className="text-xs text-gray-500 mt-2 text-center">{new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


// --- Phase 3: Infographic Card Component ---
const InfoCard = ({ Icon, title, value }) => (
  <div className="bg-white p-5 shadow rounded-lg flex items-center space-x-4">
    <div className="p-3 bg-indigo-100 rounded-full">
      <Icon className="h-6 w-6 text-indigo-600" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);


const AdminSalesPage = () => {
  const { user } = useAuth();

  // State for summary and charts
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // State for loading, errors, and pagination
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, limit: 10, totalTransactions: 0 });

  // State for filters
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const [filters, setFilters] = useState({
    startDate: formatDateForInput(yesterday),
    endDate: formatDateForInput(today),
    page: 1,
  });

  const fetchSalesSummary = useCallback(async (currentFilters) => {
    if (!user) {
      setError("User not authenticated.");
      setIsLoadingSummary(false);
      return;
    }
    setIsLoadingSummary(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const queryParams = new URLSearchParams({
        startDate: currentFilters.startDate,
        endDate: currentFilters.endDate,
      }).toString();

      const response = await fetch(`/api/admin/sales/summary?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch sales summary');
      const data = await response.json();
      if (data.success) {
        setSummary(data);
      } else {
        throw new Error(data.message || 'Failed to parse summary data');
      }
    } catch (err) {
      setError(err.message);
      setSummary(null);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [user]);

  const fetchSalesTransactions = useCallback(async (currentFilters) => {
    if (!user) {
      setError("User not authenticated.");
      setIsLoadingTransactions(false);
      return;
    }
    setIsLoadingTransactions(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const queryParams = new URLSearchParams({
        startDate: currentFilters.startDate,
        endDate: currentFilters.endDate,
        page: currentFilters.page.toString(),
        limit: (pagination.limit || 10).toString(),
      }).toString();

      const response = await fetch(`/api/admin/sales/transactions?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch sales transactions');
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
        setPagination(prev => ({
          ...prev,
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          totalTransactions: data.pagination.totalTransactions,
        }));
      } else {
        throw new Error(data.message || 'Failed to parse transaction data');
      }
    } catch (err) {
      setError(err.message);
      setTransactions([]);
      setPagination({ currentPage: 1, totalPages: 1, limit: 10, totalTransactions: 0 });
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [user, pagination.limit]);

  useEffect(() => {
    if (user) {
      fetchSalesSummary(filters);
      fetchSalesTransactions(filters);
    }
  }, [user, filters, fetchSalesSummary, fetchSalesTransactions]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };
  
  const handleRefresh = () => {
    // This just re-triggers the useEffect by setting the filters object to a new instance
    setFilters(prev => ({ ...prev }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  if (!user && !isLoadingSummary && !isLoadingTransactions) {
    return <p className="text-red-500 p-4">User not authenticated. Please login.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Sales & Summary</h1>
        <button
          onClick={handleRefresh}
          disabled={isLoadingSummary || isLoadingTransactions}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-400 transition-transform duration-500"
          title="Refresh Data"
        >
          <FiRefreshCw className={`h-5 w-5 ${ (isLoadingSummary || isLoadingTransactions) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters Section */}
      <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              name="startDate"
              id="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              name="endDate"
              id="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">Error: {error}</p>}
      
      {/* Summary / Infographics Section */}
      {isLoadingSummary ? (
        <div className="flex justify-center items-center py-10"><LoadingSpinner size="lg" /> <span className="ml-4 text-gray-600">Loading summary...</span></div>
      ) : summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InfoCard Icon={FiDollarSign} title="Total Revenue" value={formatCurrency(summary.summary.totalRevenue)} />
            <InfoCard Icon={FiShoppingCart} title="Total Transactions" value={summary.summary.totalTransactions.toLocaleString()} />
            <InfoCard Icon={FiTrendingUp} title="Avg. Order Value" value={formatCurrency(summary.summary.averageOrderValue)} />
            <InfoCard Icon={FiFileText} title="Total Items Sold" value={summary.summary.totalItemsSold.toLocaleString()} />
          </div>
          <SimpleDailySalesChart data={summary.dailySales} />
        </div>
      )}

      {/* --- Phase 4: Transactions Table --- */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h2 className="text-2xl font-semibold text-gray-800 p-6 border-b">Transaction Details</h2>
        {isLoadingTransactions ? (
          <div className="flex justify-center items-center py-20"><LoadingSpinner size="lg" /> <span className="ml-4 text-gray-600">Loading transactions...</span></div>
        ) : transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Grand Total</th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 border-b border-gray-200 text-sm">{formatDateTime(tx.transactionDate)}</td>
                      <td className="px-5 py-4 border-b border-gray-200 text-sm">
                        <span className="font-mono text-xs" title={tx.transactionId}>{tx.transactionId?.substring(0, 18) || 'N/A'}{tx.transactionId?.length > 18 ? '...' : ''}</span>
                      </td>
                      <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">{tx.items.reduce((sum, item) => sum + item.quantitySold, 0)}</td>
                      <td className="px-5 py-4 border-b border-gray-200 text-sm text-right font-medium">{formatCurrency(tx.grandTotal)}</td>
                      <td className="px-5 py-4 border-b border-gray-200 text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{tx.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="px-5 py-4 bg-white border-t flex flex-col xs:flex-row items-center xs:justify-between">
              <span className="text-xs xs:text-sm text-gray-700">
                Showing {Math.min(1 + (pagination.currentPage - 1) * pagination.limit, pagination.totalTransactions)} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalTransactions)} of {pagination.totalTransactions} Transactions
              </span>
              <div className="inline-flex mt-2 xs:mt-0">
                <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1 || isLoadingTransactions} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-l disabled:opacity-50">Prev</button>
                <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages || isLoadingTransactions} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-r disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-600 text-center py-20">No transactions found for the selected criteria.</p>
        )}
      </div>
    </div>
  );
};

export default AdminSalesPage;