'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiCalendar, FiDollarSign, FiShoppingCart, FiTrendingUp, FiArrowLeft, FiArrowRight, FiFileText, FiRefreshCw } from 'react-icons/fi';

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
}

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
};

// Simple Bar Chart Component (CSS-based for now)
const SimpleDailySalesChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-center py-4">No daily sales data to display for the selected period.</p>;
  }

  const maxRevenue = Math.max(...data.map(d => d.totalRevenue), 0);

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-md font-semibold text-gray-700 mb-3">Daily Sales Trend (Revenue)</h3>
      <div className="flex items-end h-48 space-x-2 overflow-x-auto pb-2">
        {data.map(day => (
          <div key={day.date} className="flex flex-col items-center flex-shrink-0 w-16" title={`${formatDate(day.date)}: ${formatCurrency(day.totalRevenue)}`}>
            <div
              className="w-10 bg-blue-500 hover:bg-blue-600 transition-colors"
              style={{ height: `${maxRevenue > 0 ? (day.totalRevenue / maxRevenue) * 100 : 0}%` }}
            ></div>
            <span className="text-xs text-gray-600 mt-1">{new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


const AdminSalesPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, limit: 10 });
  
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    startDate: thirtyDaysAgoStr,
    endDate: today,
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
      console.error(err);
      setError(err.message);
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
        setPagination(data.pagination);
      } else {
        throw new Error(data.message || 'Failed to parse transaction data');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      setTransactions([]); // Clear transactions on error
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [user, pagination.limit]);

  useEffect(() => {
    if (user) {
      fetchSalesSummary(filters);
      fetchSalesTransactions(filters);
    }
  }, [user, filters, fetchSalesSummary, fetchSalesTransactions]); // Corrected dependencies

  const handleFilterChange = (e) => {
    // Update filters state and reset to page 1. useEffect will trigger data fetching.
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };

  const handleApplyFilters = () => {
    // Called by "Apply Filters" button and the refresh icon.
    // Resets to page 1 (if not already) and ensures filters object is new, triggering useEffect.
    setFilters(prev => ({ ...prev, page: 1 }));
  };
  
  const handlePageChange = (newPage) => {
    // Update page in filters state. useEffect will trigger data fetching.
    setFilters(prev => ({ ...prev, page: newPage }));
  };


  if (!user && !isLoadingSummary && !isLoadingTransactions) {
    return <p className="text-red-500 p-4">User not authenticated. Please login.</p>;
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Sales Transactions & Summary</h1>
        <button
            onClick={handleApplyFilters}
            disabled={isLoadingSummary || isLoadingTransactions}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300"
            title="Refresh Data & Reset to Page 1" // Updated title
        >
            <FiRefreshCw className={`h-5 w-5 ${ (isLoadingSummary || isLoadingTransactions) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters Section */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
          <button
            onClick={handleApplyFilters}
            disabled={isLoadingSummary || isLoadingTransactions}
            className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            Apply Filters & Reset Page {/* Updated button text */}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">Error: {error}</p>}

      {/* Summary / Infographics Section */}
      {isLoadingSummary ? (
        <div className="flex justify-center items-center py-10"><LoadingSpinner size="lg" /> <span className="ml-2">Loading summary...</span></div>
      ) : summary && (
        <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <InfoCard Icon={FiDollarSign} title="Total Revenue" value={formatCurrency(summary.summary.totalRevenue)} />
                <InfoCard Icon={FiShoppingCart} title="Total Transactions" value={summary.summary.totalTransactions.toLocaleString()} />
                <InfoCard Icon={FiTrendingUp} title="Avg. Order Value" value={formatCurrency(summary.summary.averageOrderValue)} />
                <InfoCard Icon={FiFileText} title="Total Items Sold" value={summary.summary.totalItemsSold.toLocaleString()} />
            </div>
            <SimpleDailySalesChart data={summary.dailySales} />
        </div>
      )}

      {/* Transactions Table */}
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Transaction Details</h2>
      {isLoadingTransactions ? (
        <div className="flex justify-center items-center py-10"><LoadingSpinner size="lg" /> <span className="ml-2">Loading transactions...</span></div>
      ) : transactions.length > 0 ? (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                   <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Grand Total</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Method</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">{formatDateTime(tx.transactionDate)}</td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                        <span className="font-mono text-xs" title={tx.transactionId}>{tx.transactionId?.substring(0,18) || 'N/A'}{tx.transactionId?.length > 18 ? '...' : ''}</span>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">{tx.items.reduce((sum, item) => sum + item.quantitySold, 0)}</td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-right">{formatCurrency(tx.grandTotal)}</td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">{tx.paymentMethod}</td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${tx.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          tx.status === 'returned' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="py-4 flex justify-between items-center">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || isLoadingTransactions}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <FiArrowLeft className="inline mr-1"/> Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.currentPage} of {pagination.totalPages} (Total: {pagination.totalTransactions} transactions)
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || isLoadingTransactions}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next <FiArrowRight className="inline ml-1"/>
            </button>
          </div>
        </>
      ) : (
        !isLoadingTransactions && <p className="text-gray-600 text-center py-10">No transactions found for the selected criteria.</p>
      )}
    </div>
  );
};

// Infographic Card Component
const InfoCard = ({ Icon, title, value }) => (
  <div className="bg-white p-4 shadow rounded-lg flex items-center space-x-3">
    <div className="p-3 bg-indigo-100 rounded-full">
      <Icon className="h-6 w-6 text-indigo-600" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

export default AdminSalesPage;