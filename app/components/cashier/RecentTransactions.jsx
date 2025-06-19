// app/components/cashier/RecentTransactions.jsx
'use client';
import { FiEdit3, FiEye } from 'react-icons/fi'; // FiEdit3 for edit/return
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

const formatCurrency = (amount) => {
  return "Rs. " + new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'NPR', minimumFractionDigits: 0, maximumFractionDigits: 0 })
    .format(amount || 0)
    .replace("NPR", "")
    .trim();
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  // Assuming dateString is in ISO format or parsable by Date
  return new Date(dateString).toLocaleDateString('en-GB', { // Example: 18/06/2025
    day: '2-digit', month: '2-digit', year: 'numeric' 
  }) + ', ' + new Date(dateString).toLocaleTimeString('en-US', { // Example: 00:15
    hour: '2-digit', minute: '2-digit', hour12: false
  });
};

const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'returned':
    case 'partially_returned':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function RecentTransactions({ transactions, onSelectTransactionForEdit, isLoading }) {
  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg text-center h-full flex flex-col justify-center">
        <LoadingSpinner size="md" />
        <p className="mt-3 text-gray-500">Loading recent transactions...</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg text-center h-full flex flex-col justify-center">
        <FiEye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No recent transactions found.</p>
        <p className="text-xs text-gray-400 mt-1">New sales will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg h-full flex flex-col">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">Recent Transactions</h2>
      <div className="space-y-3 overflow-y-auto flex-grow custom-scrollbar pr-2"> {/* Added flex-grow */}
        {transactions.map((tx) => (
          <div key={tx.transactionId || tx._id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow duration-150">
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs text-gray-500 font-mono truncate" title={tx.transactionId}>
                ID: {tx.transactionId?.replace('SALE-', '') || 'N/A'}
              </span>
              <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(tx.transactionDate)}</span>
            </div>
            <div className="mb-2">
              <p className="text-lg font-semibold text-indigo-700">{formatCurrency(tx.grandTotal)}</p>
              <p className="text-xs text-gray-500">
                Items: {tx.items.reduce((sum, item) => sum + item.quantitySold, 0)}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={() => onSelectTransactionForEdit(tx)}
                className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium inline-flex items-center"
                title="Edit or Process Return for this Transaction"
              >
                <FiEdit3 className="mr-1 h-3 w-3" /> Edit / Return
              </button>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getStatusClass(tx.status)}`}>
                {tx.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}