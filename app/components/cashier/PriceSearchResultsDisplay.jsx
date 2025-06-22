'use client';
import { FiPlusCircle } from 'react-icons/fi';

export default function PriceSearchResultsDisplay({ products, onSelectProduct, formatCurrency }) {
  if (!products || products.length === 0) {
    // Parent component (CashierPage) will show a "no results" message via priceSearchError state.
    // This component can return null if no products.
    return null; 
  }

  return (
    <div className="mt-6 p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
        Products Matching Price: {products.length > 0 ? formatCurrency(products[0].price) : ''}
      </h3>
      <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto space-y-3 custom-scrollbar pr-2">
        {products.map((product) => (
          <div
            key={product._id || product.barcode} // Prefer _id if available
            className="p-3 sm:p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="mb-2 sm:mb-0 sm:mr-4">
              <p className="font-medium text-gray-700">{product.name}</p>
              <p className="text-xs sm:text-sm text-gray-500">
                Barcode: {product.barcode} | Stock: {product.currentStock}
              </p>
          
            </div>
            <button
              onClick={() => onSelectProduct(product)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-3 rounded-md text-xs sm:text-sm inline-flex items-center disabled:opacity-50 w-full sm:w-auto justify-center"
              disabled={product.currentStock <= 0}
            >
              <FiPlusCircle className="mr-1 sm:mr-2 h-4 w-4" />
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}