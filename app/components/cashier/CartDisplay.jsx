'use client';
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
export default function CartDisplay({ cart, onRemoveItem, onUpdateQuantity, formatCurrency }) {
  if (!cart || cart.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <p className="text-sm text-gray-400 mt-1">Scan a product to add it to the cart.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Current Bill</h2>
      <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {cart.map((item) => (
          <li key={item.barcode} className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
            <div className="flex-grow">
              <p className="font-medium text-gray-700">{item.name}</p>
              <p className="text-xs text-gray-500">
                {formatCurrency(item.priceAtSale)} x {item.quantityInCart}
              </p>
            </div>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={() => onUpdateQuantity(item.barcode, item.quantityInCart - 1)} 
                    className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100"
                    title="Decrease quantity"
                >
                    <FiMinus size={16}/>
                </button>
                <span className="text-sm w-8 text-center">{item.quantityInCart}</span>
                <button 
                    onClick={() => onUpdateQuantity(item.barcode, item.quantityInCart + 1)} 
                    className="p-1 text-gray-500 hover:text-green-600 rounded-full hover:bg-green-100"
                    title="Increase quantity"
                >
                    <FiPlus size={16}/>
                </button>
            </div>
            <p className="text-sm font-semibold text-gray-800 w-24 text-right">{formatCurrency(item.itemTotal)}</p>
            <button
              onClick={() => onRemoveItem(item.barcode)}
              className="ml-3 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
              title="Remove item"
            >
              <FiTrash2 size={18} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}