'use client';
import { FiSearch, FiPlus, FiMinus, FiDollarSign } from 'react-icons/fi';
import React from 'react'; // Ensure React is imported
import LoadingSpinner from '@/app/components/common/LoadingSpinner'; // Assuming path

export default function BarcodeScanner({
  barcode,
  setBarcode,
  isLoading, // This will be a combined loading state from parent
  inputRef,
  manualQuantity,
  setManualQuantity,
  onSearchClick, // For barcode search button

  // New props for price search
  priceSearchQuery,
  setPriceSearchQuery,
  onPriceSearch, // Function to trigger price search
  isSearchingPrice, // Boolean to indicate price search is in progress
}) {
  const handleQuantityChange = (amount) => {
    setManualQuantity(prev => {
      const newQty = prev + amount;
      return newQty < 1 ? 1 : newQty;
    });
  };

  const handlePriceInputChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and a single decimal point for price input
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") { // Allow up to 2 decimal places
      setPriceSearchQuery(value);
    }
  };

  const handlePriceSearchKeyPress = (e) => {
    if (e.key === 'Enter' && priceSearchQuery.trim() && onPriceSearch && !isSearchingPrice) {
      onPriceSearch();
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {/* Barcode Search Section */}
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
            type="button"
            onClick={onSearchClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-r-md disabled:opacity-50 flex items-center justify-center transition-colors duration-150"
            disabled={isLoading || !barcode.trim()}
            aria-label="Search Barcode"
          >
            <FiSearch className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Price Search Section - NEW */}
      <div className="mt-4">
        <label htmlFor="price-search-input" className="block text-sm font-medium text-gray-700 mb-1">
          Or Search by Price:
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
            Rs.
          </span>
          <input
            id="price-search-input"
            type="text"
            value={priceSearchQuery}
            onChange={handlePriceInputChange}
            onKeyPress={handlePriceSearchKeyPress}
            placeholder="Enter price (e.g., 150.00)"
            className="flex-grow w-full px-4 py-3 border border-gray-300 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-150"
            disabled={isLoading || isSearchingPrice}
          />
          <button
            type="button"
            onClick={onPriceSearch}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-r-md disabled:opacity-50 flex items-center justify-center transition-colors duration-150 min-w-[120px]"
            disabled={isLoading || isSearchingPrice || !priceSearchQuery.trim()}
            aria-label="Search by Price"
          >
            {isSearchingPrice ? (
              <LoadingSpinner size="xs" color="text-white" />
            ) : (
              <FiDollarSign className="h-5 w-5" />
            )}
            <span className="ml-2 hidden sm:inline">Search</span>
          </button>
        </div>
      </div>

      {/* Quantity Section (remains the same) */}
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
            aria-label="Decrease quantity"
          >
            <FiMinus className="h-5 w-5 text-gray-600" />
          </button>
          <input
            id="quantity-input"
            type="number"
            value={manualQuantity}
            onChange={(e) => setManualQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-20 text-center px-3 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-150"
            min="1"
            disabled={isLoading}
            aria-label="Current quantity"
          />
          <button
            type="button"
            onClick={() => handleQuantityChange(1)}
            className="p-3 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50"
            disabled={isLoading}
            aria-label="Increase quantity"
          >
            <FiPlus className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}