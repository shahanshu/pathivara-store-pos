'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { rtdb, ref } from '@/lib/firebase';
import { get } from 'firebase/database';
import BarcodeScanner from '@/app/components/cashier/BarcodeScanner';
import ProductDisplay from '@/app/components/cashier/ProductDisplay';
import CartDisplay from '@/app/components/cashier/CartDisplay';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import {
    FiXCircle, FiCheckCircle, FiShoppingCart, FiDollarSign, FiTrash2,
    FiPlusSquare, FiMinusSquare, FiAlertTriangle, FiPrinter,
    FiUserPlus, FiPhone, FiSearch as FiSearchUser, FiUsers
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

  const [customerPhoneNumber, setCustomerPhoneNumber] = useState("");
  const [memberName, setMemberName] = useState("");
  const [currentMember, setCurrentMember] = useState(null);
  const [isLookingUpMember, setIsLookingUpMember] = useState(false);
  const [memberLookupError, setMemberLookupError] = useState("");
  const [showRegisterMemberForm, setShowRegisterMemberForm] = useState(false);
  const [isRegisteringMember, setIsRegisteringMember] = useState(false);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);
  
  useEffect(() => {
    if (!checkoutSuccess) { // Only clear errors if not showing success message
        setCheckoutError("");
    }
    setProductError("");
  }, [cart, scannedProduct, checkoutSuccess]);

  const fetchRecentTransactions = useCallback(async () => {
    if (!user) return;
    setIsLoadingRecentTx(true);
    setCheckoutError("");
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
    if (user) { // Fetch only if user is available
        fetchRecentTransactions();
    }
  }, [user, fetchRecentTransactions, checkoutSuccess]);

  const handleBarcodeSubmit = async (submittedBarcode) => {
    if (!submittedBarcode.trim()) {
      setProductError('Please enter a barcode.');
      return;
    }
    setIsLoadingProduct(true);
    setProductError("");
    if (!checkoutSuccess) setCheckoutError("");
    setScannedProduct(null);

    try {
      const productRefPath = `productsInfo/${submittedBarcode.trim()}`;
      const productDatabaseRef = ref(rtdb, productRefPath);
      const snapshot = await get(productDatabaseRef);

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
    setProductError('');
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.barcode === productToAdd.barcode);
      const stockInRtdb = productToAdd.currentStock;
      let currentCartQuantity = 0;
      if (existingItemIndex !== -1) {
          currentCartQuantity = prevCart[existingItemIndex].quantityInCart;
      }
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
    setProductError("");
  };

  const cartTotal = cart.reduce((total, item) => total + item.itemTotal, 0);

  const clearMemberInfo = () => {
    setCurrentMember(null);
    setMemberName("");
    setMemberLookupError("");
    setShowRegisterMemberForm(false);
    setIsLookingUpMember(false);
    setIsRegisteringMember(false);
  };

  const handleLookupMember = async () => {
    if (!customerPhoneNumber.trim() || !/^\d{10}$/.test(customerPhoneNumber.trim())) {
        setMemberLookupError("Please enter a valid 10-digit phone number.");
        setShowRegisterMemberForm(false);
        return;
    }
    setIsLookingUpMember(true);
    setMemberLookupError("");
    setCurrentMember(null);
    setShowRegisterMemberForm(false);

    try {
        const memberRefPath = `memberPhoneNumbers/${customerPhoneNumber.trim()}`;
        const memberDbRef = ref(rtdb, memberRefPath);
        const rtdbSnapshot = await get(memberDbRef);

        if (rtdbSnapshot.exists()) {
            const memberData = rtdbSnapshot.val();
            setCurrentMember({
                id: memberData.memberId,
                name: memberData.name,
                phoneNumber: customerPhoneNumber.trim()
            });
            setIsLookingUpMember(false);
            return;
        }

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
             setMemberLookupError(data.message || "Failed to lookup member. Please try again.");
        }
    } catch (error) {
        console.error("Member lookup error:", error);
        setMemberLookupError(error.message || "Error looking up member. Check connection or try again.");
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
            setMemberName("");
            setMemberLookupError("");
        } else {
            if (response.status === 409 || (data.message && data.message.toLowerCase().includes("already exist"))) {
                setMemberLookupError(data.message || "This phone number is already registered.");
                setShowRegisterMemberForm(false);
                // Attempt to lookup the existing member details after a conflict
                const existingMemberResponse = await fetch(`/api/members/lookup?phoneNumber=${customerPhoneNumber.trim()}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const existingMemberData = await existingMemberResponse.json();
                if (existingMemberResponse.ok && existingMemberData.success && existingMemberData.member) {
                    setCurrentMember({
                        id: existingMemberData.member._id,
                        name: existingMemberData.member.name,
                        phoneNumber: existingMemberData.member.phoneNumber
                    });
                }
            } else {
                 setMemberLookupError(data.message || "Failed to register member.");
            }
        }
    } catch (error) {
        console.error("Member registration error:", error);
        setMemberLookupError(error.message || "Error registering member.");
    } finally {
        setIsRegisteringMember(false);
    }
  };
  
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
    setProductError(''); // Also clear product errors before checkout
    // setCheckoutSuccess(null); // Will be set on success

    try {
      const token = await user.getIdToken();
      const payload = {
          cart: cart,
          paymentMethod: 'cash',
          memberId: currentMember ? currentMember.id : null
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
      // Product error is already cleared
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
    clearMemberInfo();
    setCustomerPhoneNumber("");
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
            {checkoutSuccess.memberId && currentMember && (
                <p className="mt-1 text-sm">Sale recorded for member: {currentMember.name}</p>
            )}
             {checkoutSuccess.memberId && !currentMember && checkoutSuccess.transaction?.items?.find(item => item.memberInfo?.name) && (
                <p className="mt-1 text-sm">Sale recorded for member: {checkoutSuccess.transaction.items.find(item => item.memberInfo.name).memberInfo.name}</p>
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
            <div className="p-4 bg-white rounded-lg shadow-md space-y-3">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                    <FiUsers className="mr-2 text-indigo-500" /> Customer Membership
                </h3>
                {currentMember ? (
                    <div className="p-3 bg-blue-50 text-blue-700 rounded">
                        <p className="font-medium">Member: {currentMember.name}</p>
                        <p className="text-sm">Phone: {currentMember.phoneNumber}</p>
                        <button
                            onClick={() => {
                                if (!isCheckingOut) {
                                    clearMemberInfo();
                                    setCustomerPhoneNumber("");
                                }
                            }}
                            disabled={isCheckingOut}
                            className="mt-2 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                            Clear Member / Different Customer
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
                        {memberLookupError && !showRegisterMemberForm && <p className="text-sm text-red-500">{memberLookupError}</p>}
                        {memberLookupError && showRegisterMemberForm && <p className="text-sm text-orange-600">{memberLookupError}</p>}


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
                                    onClick={() => { setShowRegisterMemberForm(false); setMemberLookupError(""); setMemberName(""); }}
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
        </div>
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