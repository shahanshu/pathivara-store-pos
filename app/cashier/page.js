// app/cashier/page.js
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { rtdb, ref } from '@/lib/firebase'; // Get rtdb instance and ref creator
import { get } from 'firebase/database';   // Import get directly for RTDB
import BarcodeScanner from '@/app/components/cashier/BarcodeScanner';
import ProductDisplay from '@/app/components/cashier/ProductDisplay';
import CartDisplay from '@/app/components/cashier/CartDisplay';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiXCircle, FiCheckCircle, FiShoppingCart, FiDollarSign, FiTrash2, FiPlusSquare, FiMinusSquare, FiAlertTriangle, FiPrinter } from 'react-icons/fi';
import RecentTransactions from '@/app/components/cashier/RecentTransactions';
import ReturnEditModal from '@/app/components/cashier/ReturnEditModal';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
};

export default function CashierPage() {
  const { user } = useAuth();
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [productError, setProductError] = useState('');
  const [cart, setCart] = useState([]);
  const [manualQuantity, setManualQuantity] = useState(1);
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoadingRecentTx, setIsLoadingRecentTx] = useState(false);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState(null);

  const barcodeInputRef = useRef(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);
  
  useEffect(() => {
    setCheckoutError('');
    setCheckoutSuccess(null);
  }, [cart, scannedProduct]);

  const fetchRecentTransactions = useCallback(async () => {
    if (!user) return;
    setIsLoadingRecentTx(true);
    setCheckoutError(''); // Clear general errors when fetching recent transactions
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/cashier/recent-transactions', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRecentTransactions(data.transactions);
      } else {
        console.error("Failed to fetch recent transactions:", data.message);
        setCheckoutError(`Error loading recent sales: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      setCheckoutError(`Error loading recent sales: ${error.message || 'Network error'}`);
    } finally {
      setIsLoadingRecentTx(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecentTransactions();
  }, [fetchRecentTransactions, checkoutSuccess]); // Refetch when user changes or after a successful checkout

  const handleBarcodeSubmit = async (submittedBarcode) => {
    if (!submittedBarcode.trim()) {
      setProductError('Please enter a barcode.');
      return;
    }
    setIsLoadingProduct(true);
    setProductError('');
    setCheckoutError(''); 
    setCheckoutSuccess(null);
    setScannedProduct(null);

    try {
      const productRefPath = `productsInfo/${submittedBarcode.trim()}`;
      const productDatabaseRef = ref(rtdb, productRefPath); // Use ref from @/lib/firebase
      const snapshot = await get(productDatabaseRef); // Use get from firebase/database

      if (snapshot.exists()) {
        const productData = snapshot.val();
        if (productData.currentStock > 0) {
          setScannedProduct({ barcode: submittedBarcode.trim(), ...productData });
          addItemToCart({ barcode: submittedBarcode.trim(), ...productData }, manualQuantity);
          setBarcode(''); 
          setManualQuantity(1); 
          barcodeInputRef.current?.focus(); 
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
    
    setProductError(''); 

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.barcode === productToAdd.barcode);
      const stockInRtdb = productToAdd.currentStock;
      const currentCartQuantity = existingItemIndex !== -1 ? prevCart[existingItemIndex].quantityInCart : 0;

      if (currentCartQuantity + qtyToAdd > stockInRtdb) {
          setProductError(`Not enough stock for "${productToAdd.name}". Available: ${stockInRtdb - currentCartQuantity}.`);
          return prevCart; 
      }

      if (existingItemIndex !== -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantityInCart: updatedCart[existingItemIndex].quantityInCart + qtyToAdd,
          itemTotal: (updatedCart[existingItemIndex].quantityInCart + qtyToAdd) * updatedCart[existingItemIndex].priceAtSale,
        };
        return updatedCart;
      } else {
        return [
          ...prevCart,
          {
            barcode: productToAdd.barcode,
            name: productToAdd.name,
            priceAtSale: productToAdd.price, 
            quantityInCart: qtyToAdd,
            itemTotal: qtyToAdd * productToAdd.price,
            stockAvailableRTDB: productToAdd.currentStock 
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
        const stockInRtdb = itemToUpdate.stockAvailableRTDB; 

        if (newQuantity < 0) newQuantity = 0; 

        if (newQuantity > stockInRtdb) {
            setProductError(`Not enough stock for "${itemToUpdate.name}". Max available: ${stockInRtdb}.`);
            // Optionally cap at max available: newQuantity = stockInRtdb;
            return prevCart; 
        }
        
        setProductError('');

        if (newQuantity === 0) { 
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
      setCheckoutError("Cart is empty. Please add items to checkout.");
      return;
    }
    if (!user) {
        setCheckoutError("User not authenticated. Please log in again.");
        return;
    }

    setIsCheckingOut(true);
    setCheckoutError('');
    setCheckoutSuccess(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/cashier/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cart: cart, paymentMethod: 'cash' }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Checkout failed. Please try again.');
      }
      
      setCheckoutSuccess(data.transaction); 
      setCart([]); 
      setScannedProduct(null);
      setProductError('');
      
      setTimeout(() => {
        // No need to clear checkoutSuccess here, handleNewSale will do it
        barcodeInputRef.current?.focus();
      }, 100); 

    } catch (error) {
      console.error("Checkout Error:", error);
      setCheckoutError(error.message);
    } finally {
      setIsCheckingOut(false);
    }
  };
  
  const handleNewSale = () => {
    setCart([]);
    setScannedProduct(null);
    setProductError('');
    setCheckoutError('');
    setCheckoutSuccess(null);
    setIsCheckingOut(false);
    setBarcode('');
    setManualQuantity(1);
    barcodeInputRef.current?.focus();
  };

  const handleSelectTransactionForEdit = (transaction) => {
    setSelectedTxForEdit(transaction);
  };

  const handleCloseEditModal = () => {
    setSelectedTxForEdit(null);
    fetchRecentTransactions(); 
  };
  
  const handleTransactionModified = () => {
    fetchRecentTransactions(); 
    setSelectedTxForEdit(null); 
    // You might want to show a global success message here if the modal doesn't handle it
  };

  if (!user && !isLoadingProduct && !isLoadingRecentTx) { 
    return (
        <div className="flex flex-col justify-center items-center min-h-screen">
            <LoadingSpinner size="lg" message="Authenticating cashier..." />
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl">
      {checkoutSuccess ? (
        <div className="p-6 bg-green-50 text-green-700 rounded-lg shadow-md text-center">
            <FiCheckCircle className="mx-auto h-12 w-12 mb-3"/>
            <h2 className="text-2xl font-semibold">Checkout Successful!</h2>
            <p className="mt-1">Transaction ID: {checkoutSuccess.transactionId}</p>
            <p>Total Amount: {formatCurrency(checkoutSuccess.grandTotal)}</p>
            <button 
                onClick={handleNewSale}
                className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow"
            >
                Start New Sale
            </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <BarcodeScanner
            barcode={barcode}
            setBarcode={setBarcode}
            onSubmit={handleBarcodeSubmit}
            isLoading={isLoadingProduct || isCheckingOut}
            inputRef={barcodeInputRef}
            manualQuantity={manualQuantity}
            setManualQuantity={setManualQuantity}
          />
          {isLoadingProduct && <div className="p-4 bg-white rounded shadow text-center"><LoadingSpinner size="md" message="Searching..." /></div>}
          {productError && (
            <div className="p-3 bg-red-100 text-red-700 rounded shadow-sm flex items-center text-sm">
              <FiAlertTriangle className="mr-2 h-5 w-5 flex-shrink-0"/> {productError}
            </div>
          )}
          {scannedProduct && !productError && !scannedProduct.isOutOfStock && (
            <div className="p-3 bg-green-100 text-green-700 rounded shadow-sm flex items-center text-sm">
              <FiCheckCircle className="mr-2 h-5 w-5 flex-shrink-0"/> Product "{scannedProduct.name}" added.
            </div>
          )}
          {scannedProduct && scannedProduct.isOutOfStock && (
             <ProductDisplay product={scannedProduct} onAddToCart={() => {}} isCashierView={true} />
          )}
        </div>
        <div className="lg:col-span-3">
          <CartDisplay 
            cart={cart} 
            onRemoveItem={removeItemFromCart} 
            onUpdateQuantity={updateCartItemQuantity}
            formatCurrency={formatCurrency} 
          />
          {checkoutError && ( // Display general checkout/API errors here
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded shadow-sm flex items-center text-sm">
              <FiAlertTriangle className="mr-2 h-5 w-5 flex-shrink-0"/> {checkoutError}
            </div>
          )}
          {cart.length > 0 && (
            <div className="mt-6 p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between items-center text-xl font-semibold mb-3">
                <span>Total:</span>
                <span className="text-green-600">{formatCurrency(cartTotal)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50"
              >
                {isCheckingOut ? <LoadingSpinner size="sm" color="text-white mr-2"/> : <FiShoppingCart className="mr-2 h-5 w-5"/>}
                {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>
      )} 

      {!checkoutSuccess && ( 
        <div className="mt-8">
          <RecentTransactions 
            transactions={recentTransactions} 
            onSelectTransactionForEdit={handleSelectTransactionForEdit}
            isLoading={isLoadingRecentTx}
          />
        </div>
      )}

      {selectedTxForEdit && (
        <ReturnEditModal 
            transaction={selectedTxForEdit}
            isOpen={!!selectedTxForEdit}
            onClose={handleCloseEditModal}
            onTransactionModified={handleTransactionModified} 
            user={user} 
        />
      )}
    </div>
  );
}