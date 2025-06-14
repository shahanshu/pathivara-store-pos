'use client';
import { FiSearch, FiPlus, FiMinus } from 'react-icons/fi';
export default function BarcodeScanner({ barcode, setBarcode, onSubmit, isLoading, inputRef, manualQuantity, setManualQuantity }) {
  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(barcode);
  };

  const handleQuantityChange = (amount) => {
    setManualQuantity(prev => {
        const newQty = prev + amount;
        return newQty < 1 ? 1 : newQty;
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <form onSubmit={handleFormSubmit}>
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
            className="flex-grow p-2 border border-gray-300 rounded-l-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-r-md disabled:opacity-50 flex items-center justify-center"
            disabled={isLoading || !barcode.trim()}
          >
            <FiSearch className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3">
            <label htmlFor="quantity-input" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity to Add:
            </label>
            <div className="flex items-center">
                <button type="button" onClick={() => handleQuantityChange(-1)} className="p-2 border border-gray-300 rounded-l-md hover:bg-gray-100">
                    <FiMinus />
                </button>
                <input
                    id="quantity-input"
                    type="number"
                    value={manualQuantity}
                    onChange={(e) => setManualQuantity(Math.max(1, parseInt(e.target.value,10) || 1))}
                    className="w-16 text-center p-2 border-t border-b border-gray-300 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    min="1"
                />
                <button type="button" onClick={() => handleQuantityChange(1)} className="p-2 border border-gray-300 rounded-r-md hover:bg-gray-100">
                    <FiPlus />
                </button>
            </div>
        </div>
      </form>
    </div>
  );
}
