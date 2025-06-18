// app/components/cashier/ReturnEditModal.jsx
'use client';

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiX, FiSave, FiAlertTriangle, FiMinusCircle, FiPlusCircle } from 'react-icons/fi';

const formatCurrency = (amount) => {
  return "Rs. " + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'code' })
    .format(amount || 0)
    .replace("USD", "")
    .trim();
};

export default function ReturnEditModal({ transaction, isOpen, onClose, onTransactionModified, user }) {
  const [itemsToModify, setItemsToModify] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [modificationReason, setModificationReason] = useState('Customer return'); // Optional reason

  useEffect(() => {
    if (transaction && transaction.items) {
      setItemsToModify(
        transaction.items.map(item => ({
          ...item, // spread original item properties like productId, barcode, productName, priceAtSale
          originalQuantitySold: item.quantitySold,
          quantityToReturn: 0, // Initialize quantity to return as 0
        }))
      );
      setError('');
      setModificationReason('Customer return'); // Reset reason
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleQuantityToReturnChange = (productId, newQuantityToReturn) => {
    setItemsToModify(prevItems =>
      prevItems.map(item => {
        if (item.productId.toString() === productId.toString()) { // Ensure consistent ID comparison
          const qty = parseInt(newQuantityToReturn, 10);
          if (isNaN(qty) || qty < 0) {
            return { ...item, quantityToReturn: 0 };
          }
          if (qty > item.originalQuantitySold) {
            return { ...item, quantityToReturn: item.originalQuantitySold };
          }
          return { ...item, quantityToReturn: qty };
        }
        return item;
      })
    );
  };

  const incrementQty = (productId) => {
    setItemsToModify(prevItems =>
      prevItems.map(item => 
        item.productId.toString() === productId.toString() && item.quantityToReturn < item.originalQuantitySold 
        ? { ...item, quantityToReturn: item.quantityToReturn + 1 } 
        : item
      )
    );
  };

  const decrementQty = (productId) => {
    setItemsToModify(prevItems =>
      prevItems.map(item => 
        item.productId.toString() === productId.toString() && item.quantityToReturn > 0 
        ? { ...item, quantityToReturn: item.quantityToReturn - 1 } 
        : item
      )
    );
  };

  const handleSubmitModifications = async () => {
    if (!user) {
      setError("Authentication error. Please re-login.");
      return;
    }

    const itemsBeingReturned = itemsToModify.filter(item => item.quantityToReturn > 0);
    if (itemsBeingReturned.length === 0) {
      setError("No items selected for return or quantity to return is zero.");
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const token = await user.getIdToken();
      const payload = {
        originalTransactionId: transaction.transactionId,
        itemsToReturn: itemsBeingReturned.map(item => ({
          productId: item.productId, // Send ObjectId as string
          barcode: item.barcode,
          productName: item.productName, // Good for logging/confirmation on backend
          quantityToReturn: item.quantityToReturn,
          priceAtSale: item.priceAtSale // Needed for calculating refund amount accurately
        })),
        reason: modificationReason,
      };

      const response = await fetch('/api/cashier/transactions/modify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to process returns/modifications.");
      }

      onTransactionModified(); // Callback to refresh lists on the main page
      onClose(); // Close the modal

    } catch (err) {
      console.error("Error submitting modifications:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const totalItemsToReturn = itemsToModify.reduce((sum, item) => sum + item.quantityToReturn, 0);
  const totalRefundAmount = itemsToModify.reduce((sum, item) => sum + (item.quantityToReturn * item.priceAtSale), 0);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Return/Edit Items - Tx ID: <span className="font-mono text-sm">{transaction.transactionId}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <FiX size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-md text-sm flex items-center">
            <FiAlertTriangle className="mr-2 h-5 w-5 flex-shrink-0"/> {error}
          </div>
        )}

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 mb-4">
          {itemsToModify.map((item) => (
            <div key={item.productId} className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md bg-gray-50">
              <div className="col-span-5">
                <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                <p className="text-xs text-gray-500">Barcode: {item.barcode}</p>
              </div>
              <div className="col-span-3 text-xs text-gray-600 text-center">
                Sold: {item.originalQuantitySold} @ {formatCurrency(item.priceAtSale)}
              </div>
              <div className="col-span-4 flex items-center justify-end space-x-1">
                <label htmlFor={`returnQty-${item.productId}`} className="text-xs text-gray-700 mr-1">Return:</label>
                <button onClick={() => decrementQty(item.productId)} className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 disabled:opacity-50" disabled={item.quantityToReturn <= 0}>
                    <FiMinusCircle size={18}/>
                </button>
                <input
                  id={`returnQty-${item.productId}`}
                  type="number"
                  min="0"
                  max={item.originalQuantitySold}
                  value={item.quantityToReturn}
                  onChange={(e) => handleQuantityToReturnChange(item.productId, e.target.value)}
                  className="w-12 text-center p-1 border border-gray-300 rounded-md sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <button onClick={() => incrementQty(item.productId)} className="p-1 text-green-500 hover:text-green-700 rounded-full hover:bg-green-100 disabled:opacity-50" disabled={item.quantityToReturn >= item.originalQuantitySold}>
                    <FiPlusCircle size={18}/>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
            <label htmlFor="modificationReason" className="block text-sm font-medium text-gray-700">Reason for Modification (Optional)</label>
            <input 
                type="text" 
                id="modificationReason"
                value={modificationReason}
                onChange={(e) => setModificationReason(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Customer return, incorrect item"
            />
        </div>


        {totalItemsToReturn > 0 && (
            <div className="text-right font-semibold text-md text-red-600 mb-4">
                Total Refund Due: {formatCurrency(totalRefundAmount)}
            </div>
        )}

        <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitModifications}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center text-sm font-medium"
            disabled={isProcessing || totalItemsToReturn === 0}
          >
            {isProcessing ? <LoadingSpinner size="sm" color="text-white mr-2"/> : <FiSave className="mr-2"/>}
            {isProcessing ? 'Processing...' : 'Confirm Return/Modification'}
          </button>
        </div>
      </div>
    </div>
  );
}