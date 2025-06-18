// app/components/cashier/RecentTransactions.jsx
'use client';

import { FiEdit3, FiEye } from 'react-icons/fi'; // FiEdit3 for edit/return

const formatCurrency = (amount) => {
  return "Rs. " + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'code' })
    .format(amount || 0)
    .replace("USD", "")
    .trim();
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
};

export default function RecentTransactions({ transactions, onSelectTransactionForEdit, isLoading }) {
  if (isLoading) {
    return <div className="p-4 bg-white rounded-lg shadow text-center text-gray-500">Loading recent transactions...</div>;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-gray-500">No recent transactions found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">Recent Transactions</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {transactions.map((tx) => (
          <div key={tx._id || tx.transactionId} className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">ID: {tx.transactionId}</p>
                <p className="text-sm font-medium text-gray-700">
                  Total: {formatCurrency(tx.grandTotal)}
                </p>
                <p className="text-xs text-gray-500">
                  Items: {tx.items.reduce((sum, item) => sum + item.quantitySold, 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{formatDate(tx.transactionDate)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-700' : 
                    tx.status === 'returned' || tx.status === 'partially_returned' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-gray-100 text-gray-700'
                }`}>
                    {tx.status}
                </span>
              </div>
            </div>
            <div className="mt-2 text-right">
              <button
                onClick={() => onSelectTransactionForEdit(tx)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-end"
                title="Edit or Process Return for this Transaction"
              >
                <FiEdit3 className="mr-1" /> Edit / Return
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}