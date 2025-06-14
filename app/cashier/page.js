// app/cashier/page.js
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { rtdb } from '@/lib/firebase'; // Import rtdb
import { ref, get } from 'firebase/database';
import BarcodeScanner from '@/app/components/cashier/BarcodeScanner';
import ProductDisplay from '@/app/components/cashier/ProductDisplay';
import CartDisplay from '@/app/components/cashier/CartDisplay';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiXCircle, FiCheckCircle, FiShoppingCart, FiDollarSign, FiTrash2, FiPlusSquare, FiMinusSquare, FiAlertTriangle } from 'react-icons/fi';


const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
};

export default function CashierPage() {
  const { user } = useAuth();
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null); // Product details from RTDB
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [productError, setProductError] = useState('');
  const [cart, setCart] = useState([]);
  const [manualQuantity, setManualQuantity] = useState(1);

  const barcodeInputRef = useRef(null);

  useEffect(() => {
    // Automatically focus the barcode input on page load
    barcodeInputRef.current?.focus();
  }, []);

  const handleBarcodeSubmit = async (submittedBarcode) => {
    if (!submittedBarcode.trim()) {
      setProductError('Please enter a barcode.');
      return;
    }
    setIsLoadingProduct(true);
    setProductError('');
    setScannedProduct(null);

    try {
      const productRef = ref(rtdb, `productsInfo/${submittedBarcode.trim()}`);
      const snapshot = await get(productRef);

      if (snapshot.exists()) {
        const productData = snapshot.val();
        if (productData.currentStock > 0) {
          setScannedProduct({ barcode: submittedBarcode.trim(), ...productData });
          // Automatically add to cart if preference is set, or require manual add
          // For now, let's keep it manual or auto-add
          addItemToCart({ barcode: submittedBarcode.trim(), ...productData }, manualQuantity);
          setBarcode(''); // Clear barcode input for next scan
          setManualQuantity(1); // Reset manual quantity
          barcodeInputRef.current?.focus(); // Re-focus after successful scan & add
        } else {
          setProductError(`Product "${productData.name}" is out of stock.`);
          setScannedProduct({ barcode: submittedBarcode.trim(), ...productData, isOutOfStock: true });
        }
      } else {
        setProductError(`Product with barcode "${submittedBarcode.trim()}" not found.`);
      }
    } catch (error) {
      console.error("Error fetching product from RTDB:", error);
      setProductError('Error fetching product details. Please try again.');
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const addItemToCart = (productToAdd, quantity) => {
    if (!productToAdd || productToAdd.currentStock <= 0) {
      setProductError(productToAdd ? `"${productToAdd.name}" is out of stock.` : 'No product to add.');
      return;
    }

    const qtyToAdd = parseInt(quantity, 10);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
        setProductError("Invalid quantity.");
        return;
    }
    
    setProductError(''); // Clear previous product error on successful add

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.barcode === productToAdd.barcode);
      // Check available stock in RTDB vs quantity already in cart + quantity to add
      const stockInRtdb = productToAdd.currentStock;
      const currentCartQuantity = existingItemIndex !== -1 ? prevCart[existingItemIndex].quantityInCart : 0;

      if (currentCartQuantity + qtyToAdd > stockInRtdb) {
          setProductError(`Not enough stock for "${productToAdd.name}". Available: ${stockInRtdb - currentCartQuantity}.`);
          return prevCart; // Return previous cart without changes
      }

      if (existingItemIndex !== -1) {
        // Item exists, update quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantityInCart: updatedCart[existingItemIndex].quantityInCart + qtyToAdd,
          itemTotal: (updatedCart[existingItemIndex].quantityInCart + qtyToAdd) * updatedCart[existingItemIndex].priceAtSale,
        };
        return updatedCart;
      } else {
        // New item
        return [
          ...prevCart,
          {
            barcode: productToAdd.barcode,
            name: productToAdd.name,
            priceAtSale: productToAdd.price, // Price from RTDB at the time of adding
            quantityInCart: qtyToAdd,
            itemTotal: qtyToAdd * productToAdd.price,
            stockAvailableRTDB: productToAdd.currentStock // Store initial stock for reference
          },
        ];
      }
    });
  };
  
  const updateCartItemQuantity = (barcode, newQuantity) => {
    setCart(prevCart => {
        const itemIndex = prevCart.findIndex(item => item.barcode === barcode);
        if (itemIndex === -1) return prevCart;

        const itemToUpdate = prevCart[itemIndex];
        const stockInRtdb = itemToUpdate.stockAvailableRTDB; // Use the stock available when item was first added

        if (newQuantity < 0) newQuantity = 0; // Prevent negative quantity

        if (newQuantity > stockInRtdb) {
            setProductError(`Not enough stock for "${itemToUpdate.name}". Max available: ${stockInRtdb}.`);
            // Optionally, cap at max available: newQuantity = stockInRtdb;
            return prevCart; // Or update to max available
        }
        
        setProductError(''); // Clear error if quantity is valid

        if (newQuantity === 0) { // Remove item if quantity becomes 0
            return prevCart.filter(item => item.barcode !== barcode);
        }

        const updatedCart = [...prevCart];
        updatedCart[itemIndex] = {
            ...itemToUpdate,
            quantityInCart: newQuantity,
            itemTotal: newQuantity * itemToUpdate.priceAtSale,
        };
        return updatedCart;
    });
  };


  const removeItemFromCart = (barcodeToRemove) => {
    setCart(prevCart => prevCart.filter(item => item.barcode !== barcodeToRemove));
  };

  const cartTotal = cart.reduce((total, item) => total + item.itemTotal, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setProductError("Cart is empty. Please add items to checkout.");
      return;
    }
    // TODO: Implement checkout logic
    // 1. Create transaction in MongoDB salesTransactions
    // 2. Update product stock in MongoDB products for each item
    // 3. Sync updated stock to Firebase RTDB /productsInfo/{barcode}/currentStock
    // 4. Add lightweight record to RTDB /recentCashierTransactions/{cashierId}
    // 5. Clear cart and provide success feedback
    alert(`Checkout initiated for ${cart.length} item(s). Total: ${formatCurrency(cartTotal)}. (Full logic pending)`);
    // For now, just clear cart
    setCart([]);
    setScannedProduct(null);
    setProductError('');
    barcodeInputRef.current?.focus();
  };

  if (!user) {
    return <LoadingSpinner message="Authenticating cashier..." />;
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Scanner and Product Info */}
        <div className="md:col-span-1 space-y-4">
          <BarcodeScanner
            barcode={barcode}
            setBarcode={setBarcode}
            onSubmit={handleBarcodeSubmit}
            isLoading={isLoadingProduct}
            inputRef={barcodeInputRef}
            manualQuantity={manualQuantity}
            setManualQuantity={setManualQuantity}
          />
          {isLoadingProduct && <div className="p-4 bg-white rounded shadow text-center"><LoadingSpinner size="md" message="Searching..." /></div>}
          {productError && (
            <div className="p-3 bg-red-100 text-red-700 rounded shadow-sm flex items-center">
              <FiAlertTriangle className="mr-2 h-5 w-5"/> {productError}
            </div>
          )}
          {scannedProduct && !productError && !scannedProduct.isOutOfStock && (
            <div className="p-3 bg-green-100 text-green-700 rounded shadow-sm flex items-center">
              <FiCheckCircle className="mr-2 h-5 w-5"/> Product "{scannedProduct.name}" added to cart.
            </div>
          )}
          {scannedProduct && scannedProduct.isOutOfStock && (
             <ProductDisplay product={scannedProduct} onAddToCart={() => {}} isCashierView={true} />
          )}

        </div>

        {/* Right Column: Cart and Checkout */}
        <div className="md:col-span-2">
          <CartDisplay 
            cart={cart} 
            onRemoveItem={removeItemFromCart} 
            onUpdateQuantity={updateCartItemQuantity}
            formatCurrency={formatCurrency} 
          />
          {cart.length > 0 && (
            <div className="mt-6 p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between items-center text-xl font-semibold">
                <span>Total:</span>
                <span className="text-green-600">{formatCurrency(cartTotal)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50"
              >
                <FiShoppingCart className="mr-2 h-5 w-5"/> Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}