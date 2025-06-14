'use client';
import { FiArchive } from 'react-icons/fi';
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
};

export default function ProductDisplay({ product, onAddToCart, isCashierView = false }) {
  if (!product) return null;

  const canAddToCart = product.currentStock > 0 && !product.isOutOfStock;

  return (
    <div className={`p-4 bg-white rounded-lg shadow-md ${product.isOutOfStock ? 'border-l-4 border-red-500' : ''}`}>
      <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
      <p className="text-sm text-gray-600">Barcode: {product.barcode}</p>
      <p className="text-md font-medium text-green-600">Price: {formatCurrency(product.price)}</p>
      <p className={`text-sm ${product.currentStock > 0 ? 'text-gray-700' : 'text-red-600 font-semibold'}`}>
        Stock: {product.currentStock > 0 ? product.currentStock : 'Out of Stock'}
      </p>
      {isCashierView && product.isOutOfStock && (
        <p className="mt-2 text-sm text-red-500 font-medium flex items-center">
          <FiArchive className="mr-1"/> This product is currently unavailable.
        </p>
      )}
      {/* Add to cart button is handled by auto-add or main page for now */}
    </div>
  );
}