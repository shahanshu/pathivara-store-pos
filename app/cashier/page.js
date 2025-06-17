'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { rtdb, ref } from '@/lib/firebase'; // Get rtdb instance and ref creator
import { get } from 'firebase/database';   // Import get directly for RTDB
import BarcodeScanner from '@/app/components/cashier/BarcodeScanner';
import ProductDisplay from '@/app/components/cashier/ProductDisplay';
import CartDisplay from '@/app/components/cashier/CartDisplay';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import {
    FiXCircle, FiCheckCircle, FiShoppingCart, FiDollarSign, FiTrash2,
    FiPlusSquare, FiMinusSquare, FiAlertTriangle, FiPrinter,
    FiUserPlus, FiPhone, FiSearch as FiSearchUser, FiUsers // Added icons for membership
} from 'react-icons/fi';
import RecentTransactions from '@/app/components/cashier/RecentTransactions';
import ReturnEditModal from '@/app/components/cashier/ReturnEditModal';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
};

export default function CashierPage() {
  const { user } = useAuth();
  const [barcode, setBarcode] = useState("");
  const [scannedProduct, setScannedProduct] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [productError, setProductError] = useState("");
  const [cart, setCart] = useState([]);
  const [manualQuantity, setManualQuantity] = useState(1);
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoadingRecentTx, setIsLoadingRecentTx] = useState(false);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState(null);

  const barcodeInputRef = useRef(null);

  // --- START: Membership State ---
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState("");
  const [memberName, setMemberName] = useState(""); // For new member registration
  const [currentMember, setCurrentMember] = useState(null); // { id: 'mongoId', name: 'John Doe', phoneNumber: '123...' }
  const [isLookingUpMember, setIsLookingUpMember] = useState(false);
  const [memberLookupError, setMemberLookupError] = useState("");
  const [showRegisterMemberForm, setShowRegisterMemberForm] = useState(false);
  const [isRegisteringMember, setIsRegisteringMember] = useState(false);
  // --- END: Membership State ---

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);
  
  useEffect(() => {
    setCheckoutError("");
    setCheckoutSuccess(null);
    setProductError(""); // Clear product error when cart or scanned product changes
    // Do not clear member info here, it should persist until 'New Sale' or explicit clear
  }, [cart, scannedProduct]);

  const fetchRecentTransactions = useCallback(async () => {
    if (!user) return;
    setIsLoadingRecentTx(true);
    setCheckoutError(""); // Clear general errors when fetching recent transactions
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
    setProductError("");
    setCheckoutError(""); 
    // setCheckoutSuccess(null); // Keep success message until new sale explicitly started or items change
    setScannedProduct(null);

    try {
      const productRefPath = `productsInfo/${submittedBarcode.trim()}`;
      const productDatabaseRef = ref(rtdb, productRefPath); // Use ref from @/lib/firebase
      const snapshot = await get(productDatabaseRef); // Use get from firebase/database

      if (snapshot.exists()) {
        const productData = snapshot.val();
        if (productData.currentStock > 0) {
          const productToAdd = { barcode: submittedBarcode.trim(), ...productData };
          setScannedProduct(productToAdd);
          addItemToCart(productToAdd, manualQuantity);
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
    
    setProductError(''); // Clear previous errors

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.barcode === productToAdd.barcode);
      const stockInRtdb = productToAdd.currentStock; // This is from RTDB /productsInfo
      
      let currentCartQuantity = 0;
      if (existingItemIndex !== -1) {
          currentCartQuantity = prevCart[existingItemIndex].quantityInCart;
      }

      if (currentCartQuantity + qtyToAdd > stockInRtdb) {
          setProductError(`Not enough stock for "${productToAdd.name}". Available: ${stockInRtdb - currentCartQuantity}.`);
          return prevCart; // Return original cart without changes
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
            priceAtSale: productToAdd.price, // Use price from RTDB productData
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
    setProductError(""); // Clear any product error when item is removed
  };

  const cartTotal = cart.reduce((total, item) => total + item.itemTotal, 0);

  // --- START: Membership Functions ---
  const handleLookupMember = async () => {
    if (!customerPhoneNumber.trim() || !/^\d{10}$/.test(customerPhoneNumber.trim())) {
        setMemberLookupError("Please enter a valid 10-digit phone number.");
        return;
    }
    setIsLookingUpMember(true);
    setMemberLookupError("");
    setCurrentMember(null);
    setShowRegisterMemberForm(false);

    try {
        // 1. Try RTDB
        const memberRefPath = `memberPhoneNumbers/${customerPhoneNumber.trim()}`;
        const memberDbRef = ref(rtdb, memberRefPath);
        const rtdbSnapshot = await get(memberDbRef);

        if (rtdbSnapshot.exists()) {
            const memberData = rtdbSnapshot.val();
            setCurrentMember({
                id: memberData.memberId, // This is MongoDB _id
                name: memberData.name,
                phoneNumber: customerPhoneNumber.trim()
            });
            setIsLookingUpMember(false);
            return;
        }

        // 2. Fallback to MongoDB via API (if not in RTDB)
        const token = await user.getIdToken();
        const response = await fetch(`/api/members/lookup?phoneNumber=${customerPhoneNumber.trim()}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();

        if (response.ok && data.success && data.member) {
            setCurrentMember({
                id: data.member._id,
                name: data.member.name,
                phoneNumber: data.member.phoneNumber
            });
        } else if (response.status === 404 || (data.success && !data.member)) {
            setMemberLookupError("Member not found. Would you like to register?");
            setShowRegisterMemberForm(true);
        } else {
            throw new Error(data.message || "Failed to lookup member.");
        }
    } catch (error) {
        console.error("Member lookup error:", error);
        setMemberLookupError(error.message || "Error looking up member.");
        setShowRegisterMemberForm(true); // Offer registration on error too
    } finally {
        setIsLookingUpMember(false);
    }
  };

  const handleRegisterMember = async (e) => {
    e.preventDefault();
    if (!memberName.trim() || !customerPhoneNumber.trim() || !/^\d{10}$/.test(customerPhoneNumber.trim())) {
        setMemberLookupError("Name and a valid 10-digit phone number are required for registration.");
        return;
    }
    setIsRegisteringMember(true);
    setMemberLookupError("");
    try {
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/members', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ name: memberName, phoneNumber: customerPhoneNumber.trim() }),
        });
        const data = await response.json();

        if (response.ok && data.success && data.member) {
            setCurrentMember({
                id: data.member._id,
                name: data.member.name,
                phoneNumber: data.member.phoneNumber
            });
            setShowRegisterMemberForm(false);
            setMemberName(""); // Clear form
        } else {
            throw new Error(data.message || "Failed to register member.");
        }
    } catch (error) {
        console.error("Member registration error:", error);
        setMemberLookupError(error.message || "Error registering member.");
    } finally {
        setIsRegisteringMember(false);
    }
  };
  
  const clearMemberInfo = () => {
    setCurrentMember(null);
    setCustomerPhoneNumber("");
    setMemberName("");
    setMemberLookupError("");
    setShowRegisterMemberForm(false);
  };
  // --- END: Membership Functions ---

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
      const payload = {
          cart: cart,
          paymentMethod: 'cash', // Default, can be expanded
          memberId: currentMember ? currentMember.id : null // Include memberId if available
      };
      const response = await fetch('/api/cashier/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Checkout failed. Please try again.');
      }
      
      setCheckoutSuccess(data.transaction); 
      setCart([]); 
      setScannedProduct(null);
      setProductError('');
      // Member info is cleared by handleNewSale or when user starts new implicit transaction
      
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
    clearMemberInfo(); // Clear member information for the new sale
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
    fetchRecentTransactions(); // Refresh list after modification
    // Modal itself handles close on success/cancel via its onClose prop
  };

  if (!user && !isLoadingProduct && !isLoadingRecentTx && !isLookingUpMember && !isRegisteringMember) { 
    return (
        <div className="flex flex-col justify-center items-center min-h-screen p-4">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-700">Authenticating cashier...</p>
            <p className="mt-2 text-sm text-gray-500">If this persists, please try logging in again.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-4">
      {checkoutSuccess ? (
        <div className="p-6 bg-green-50 text-green-700 rounded-lg shadow-md text-center mb-6">
            <FiCheckCircle className="mx-auto h-16 w-16 mb-3"/>
            <h2 className="text-2xl font-semibold">Checkout Successful!</h2>
            <p className="mt-1">Transaction ID: {checkoutSuccess.transactionId}</p>
            <p>Total Amount: {formatCurrency(checkoutSuccess.grandTotal)}</p>
            {checkoutSuccess.memberId && currentMember && ( // Check currentMember as well, as it might have been cleared if checkoutSuccess persists longer
                <p className="mt-1 text-sm">Sale recorded for member: {currentMember.name}</p>
            )}
             {checkoutSuccess.memberId && !currentMember && checkoutSuccess.memberName && ( // Fallback if currentMember is cleared but transaction had a member
                <p className="mt-1 text-sm">Sale recorded for member: {checkoutSuccess.memberName}</p>
            )}
            <button 
                onClick={handleNewSale}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors"
            >
                Start New Sale
            </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Barcode, Product, Member Lookup */}
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
          {isLoadingProduct && (
            <div className="p-4 bg-white rounded shadow text-center">
                <LoadingSpinner size="md" />
                <p className="mt-2 text-sm text-gray-600">Searching product...</p>
            </div>
          )}
          {productError && (
            <div className="p-3 bg-red-100 text-red-700 rounded shadow-sm flex items-center text-sm">
              <FiAlertTriangle className="mr-2 h-5 w-5 flex-shrink-0"/> {productError}
            </div>
          )}
          {scannedProduct && !productError && !scannedProduct.isOutOfStock && (
            <div className="p-3 bg-green-100 text-green-700 rounded shadow-sm flex items-center text-sm">
              <FiCheckCircle className="mr-2 h-5 w-5 flex-shrink-0"/> {`Product "${scannedProduct.name}" added to cart.`}
            </div>
          )}
          {scannedProduct && scannedProduct.isOutOfStock && (
             <ProductDisplay product={scannedProduct} onAddToCart={() => {}} isCashierView={true} />
          )}

            {/* --- START: Membership Section UI --- */}
            <div className="p-4 bg-white rounded-lg shadow-md space-y-3">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                    <FiUsers className="mr-2 text-indigo-500" /> Customer Membership
                </h3>
                {currentMember ? (
                    <div className="p-3 bg-blue-50 text-blue-700 rounded">
                        <p className="font-medium">Member: {currentMember.name}</p>
                        <p className="text-sm">Phone: {currentMember.phoneNumber}</p>
                        <button
                            onClick={clearMemberInfo}
                            className="mt-2 text-xs text-red-500 hover:text-red-700"
                        >
                            Clear Member / Scan for different customer
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-end space-x-2">
                            <div className="flex-grow">
                                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-600">
                                    Phone Number (10 digits)
                                </label>
                                <input
                                    type="tel"
                                    id="customerPhone"
                                    value={customerPhoneNumber}
                                    onChange={(e) => setCustomerPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="Enter 10-digit phone"
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                    disabled={isLookingUpMember || showRegisterMemberForm || isCheckingOut}
                                    maxLength={10}
                                />
                            </div>
                            <button
                                onClick={handleLookupMember}
                                disabled={isLookingUpMember || !customerPhoneNumber || customerPhoneNumber.length < 10 || isCheckingOut}
                                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow disabled:opacity-50 h-[42px] flex items-center"
                            >
                                {isLookingUpMember ? <LoadingSpinner size="sm" color="text-white" /> : <FiSearchUser size={20} />}
                                <span className="ml-2 hidden sm:inline">Lookup</span>
                            </button>
                        </div>
                        {memberLookupError && <p className="text-sm text-red-500">{memberLookupError}</p>}

                        {showRegisterMemberForm && !currentMember && (
                            <form onSubmit={handleRegisterMember} className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                <p className="text-sm font-medium text-gray-700">Register New Member:</p>
                                <div>
                                    <label htmlFor="memberName" className="block text-xs font-medium text-gray-600">Member Name*</label>
                                    <input
                                        type="text"
                                        id="memberName"
                                        value={memberName}
                                        onChange={(e) => setMemberName(e.target.value)}
                                        required
                                        placeholder="Enter member's full name"
                                        className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        disabled={isRegisteringMember || isCheckingOut}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isRegisteringMember || !memberName || isCheckingOut}
                                    className="w-full p-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isRegisteringMember ? <LoadingSpinner size="sm" color="text-white" /> : <FiUserPlus size={18} />}
                                    <span className="ml-2">Register Member</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowRegisterMemberForm(false); setMemberLookupError(""); setMemberName(""); /* Keep phone number */ }}
                                    className="w-full mt-2 p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                                    disabled={isRegisteringMember || isCheckingOut}
                                >
                                    Cancel Registration
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
            {/* --- END: Membership Section UI --- */}
        </div>

        {/* Right Column: Cart, Checkout */}
        <div className="lg:col-span-3">
          <CartDisplay 
            cart={cart} 
            onRemoveItem={removeItemFromCart} 
            onUpdateQuantity={updateCartItemQuantity}
            formatCurrency={formatCurrency} 
          />
          {checkoutError && ( 
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
              {currentMember && (
                  <p className="text-sm text-blue-600 mb-3">
                      Billing to member: <strong>{currentMember.name}</strong> ({currentMember.phoneNumber})
                  </p>
              )}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50"
              >
                {isCheckingOut ? <LoadingSpinner size="sm" color="text-white mr-2"/> : <FiShoppingCart className="mr-2 h-5 w-5"/>}
                {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>
      )} 

      {/* Recent Transactions outside the main transaction flow columns, always visible unless checkout success is shown */}
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