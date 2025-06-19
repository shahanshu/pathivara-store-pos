// app/components/cashier/CartDisplay.jsx
'use client';
import { FiTrash2, FiPlus, FiMinus, FiShoppingCart } from 'react-icons/fi'; // Added FiShoppingCart

export default function CartDisplay({ cart, onRemoveItem, onUpdateQuantity, formatCurrency }) {
  if (!cart || cart.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg text-center flex-grow flex flex-col justify-center items-center min-h-[300px]"> {/* Added min-h for better empty state */}
        <FiShoppingCart className="h-24 w-24 text-gray-300 mb-6" />
        <p className="text-xl font-semibold text-gray-700">Your cart is empty.</p>
        <p className="text-sm text-gray-500 mt-2">Scan a product to add it to the cart.</p>
      </div>
    );
  }

  const cartTotal = cart.reduce((total, item) => total + item.itemTotal, 0);

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-200">Current Bill</h2>
      <ul className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar"> {/* Added custom-scrollbar class if you have global scrollbar styles */}
        {cart.map((item) => (
          <li key={item.barcode} className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150">
            <div className="flex-grow">
              <p className="font-medium text-gray-800 text-md">{item.name}</p>
              <p className="text-xs text-gray-500">
                {formatCurrency(item.priceAtSale)} x {item.quantityInCart}
              </p>
            </div>
            <div className="flex items-center space-x-2 mx-3">
              <button 
                onClick={() => onUpdateQuantity(item.barcode, item.quantityInCart - 1)} 
                className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors duration-150 disabled:opacity-50"
                title="Decrease quantity"
                disabled={item.quantityInCart <= 1}
              >
                <FiMinus size={18}/>
              </button>
              <span className="text-md font-medium text-gray-700 w-8 text-center">{item.quantityInCart}</span>
              <button 
                onClick={() => onUpdateQuantity(item.barcode, item.quantityInCart + 1)} 
                className="p-2 text-gray-500 hover:text-green-600 rounded-full hover:bg-green-50 transition-colors duration-150 disabled:opacity-50" // Add disabled logic if stock is checked here
                title="Increase quantity"
              >
                <FiPlus size={18}/>
              </button>
            </div>
            <p className="text-md font-semibold text-gray-800 w-28 text-right">{formatCurrency(item.itemTotal)}</p>
            <button
              onClick={() => onRemoveItem(item.barcode)}
              className="ml-4 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors duration-150"
              title="Remove item"
            >
              <FiTrash2 size={20} />
            </button>
          </li>
        ))}
      </ul>
      {cart.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-xl font-semibold text-gray-800">
            <span>Total:</span>
            <span className="text-indigo-600">{formatCurrency(cartTotal)}</span>
          </div>
          {/* Checkout button will be part of the main page, not CartDisplay typically */}
        </div>
      )}
    </div>
  );
}