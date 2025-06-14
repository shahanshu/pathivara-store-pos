// app/components/cashier/ReturnEditModal.jsx
'use client';

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiX, FiSave, FiTrash2, FiAlertTriangle } from 'react-icons/fi';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
};

export default function ReturnEditModal({ transaction, isOpen, onClose, onTransactionModified, user }) {
  if (!isOpen || !transaction) return null;

  // Placeholder content - full implementation in the next step
  const [itemsToModify, setItemsToModify] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      // Initialize itemsToModify based on transaction.items
      // Each item should have original quantity and quantityToReturn
      setItemsToModify(transaction.items.map(item => ({
        ...item,
        originalQuantitySold: item.quantitySold,
        quantityToReturn: 0, // Default to 0
      })));
    }
  }, [transaction]);

  const handleSubmitModifications = async () => {
    // TODO: Implement API call to /api/cashier/transactions/modify
    alert("Modification logic to be implemented!");
    onTransactionModified(); // Simulate success for now
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit / Return Items for Tx ID: {transaction.transactionId}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={24} />
          </button>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Placeholder: Full item list and return quantity inputs will go here.
          </p>
          {/* Example Item Structure (to be built out) */}
          {itemsToModify.map(item => (
            <div key={item.productId || item.barcode} className="py-2 border-b">
              {item.productName} (Sold: {item.originalQuantitySold}) - Return: {/* Input field here */}
            </div>
          ))}

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitModifications}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
            disabled={isProcessing}
          >
            {isProcessing ? <LoadingSpinner size="sm" color="text-white mr-2"/> : <FiSave className="mr-2"/>}
            {isProcessing ? 'Processing...' : 'Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}