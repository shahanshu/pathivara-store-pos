// app/components/cashier/BarcodeScanner.jsx
'use client';
import { FiSearch, FiPlus, FiMinus } from 'react-icons/fi';

export default function BarcodeScanner({ 
  barcode, 
  setBarcode, 
  // onSubmit is not explicitly in the new design's flow for the main search button, 
  // but we can keep it if the debounced search doesn't cover all cases.
  // For now, the main search is via icon button, usually tied to processBarcodeSubmission directly.
  isLoading, 
  inputRef, 
  manualQuantity,
  setManualQuantity,
  onSearchClick // New prop for explicit search button click
}) {

  const handleQuantityChange = (amount) => {
    setManualQuantity(prev => {
      const newQty = prev + amount;
      return newQty < 1 ? 1 : newQty;
    });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <div>
        <label htmlFor="barcode-input" className="block text-sm font-medium text-gray-700 mb-1">
          Scan or Enter Barcode:
        </label>
        <div className="flex">
          <input
            ref={inputRef}
            id="barcode-input"
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Enter product barcode"
            className="flex-grow w-full px-4 py-3 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-150"
            disabled={isLoading}
          />
          <button
            type="button" // Changed from submit if it's not part of a form submission
            onClick={onSearchClick} // Use the new prop
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-r-md disabled:opacity-50 flex items-center justify-center transition-colors duration-150"
            disabled={isLoading || !barcode.trim()}
          >
            <FiSearch className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="quantity-input" className="block text-sm font-medium text-gray-700 mb-1">
          Quantity to Add:
        </label>
        <div className="flex items-center space-x-2">
          <button 
            type="button" 
            onClick={() => handleQuantityChange(-1)} 
            className="p-3 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50"
            disabled={isLoading || manualQuantity <= 1}
          >
            <FiMinus className="h-5 w-5 text-gray-600"/>
          </button>
          <input
            id="quantity-input"
            type="number"
            value={manualQuantity}
            onChange={(e) => setManualQuantity(Math.max(1, parseInt(e.target.value,10) || 1))}
            className="w-20 text-center px-3 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-150"
            min="1"
            disabled={isLoading}
          />
          <button 
            type="button" 
            onClick={() => handleQuantityChange(1)} 
            className="p-3 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50"
            disabled={isLoading}
          >
            <FiPlus className="h-5 w-5 text-gray-600"/>
          </button>
        </div>
      </div>
    </div>
  );
}