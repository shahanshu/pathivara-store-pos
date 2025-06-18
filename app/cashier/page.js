// app/cashier/page.js
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext'; // Ensure this path is correct
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
 return "Rs. " + new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'NPR', minimumFractionDigits: 0, maximumFractionDigits: 0 })
 .format(amount || 0)
 .replace("NPR", "")
 .trim();
};

const SCAN_DEBOUNCE_DELAY = 200;

export default function CashierPage() {
 const { user } = useAuth();
 const [barcode, setBarcode] = useState("");
 const [scannedProduct, setScannedProduct] = useState(null);
 const [isLoadingProduct, setIsLoadingProduct] = useState(false);
 const [productError, setProductError] = useState("");
 const [cart, setCart] = useState([]);
 const [manualQuantity, setManualQuantity] = useState(1);

 const [isCheckingOut, setIsCheckingOut] = useState(false);
 const [checkoutError, setCheckoutError] = useState("");

 const [recentTransactions, setRecentTransactions] = useState([]);
 const [isLoadingRecentTx, setIsLoadingRecentTx] = useState(false);
 const [selectedTxForEdit, setSelectedTxForEdit] = useState(null);

 const barcodeInputRef = useRef(null);
 const debounceTimerRef = useRef(null);

 const [customerPhoneNumber, setCustomerPhoneNumber] = useState("");
 const [memberName, setMemberName] = useState("");
 const [currentMember, setCurrentMember] = useState(null);
 const [isLookingUpMember, setIsLookingUpMember] = useState(false);
 const [memberLookupError, setMemberLookupError] = useState("");
 const [showRegisterMemberForm, setShowRegisterMemberForm] = useState(false);
 const [isRegisteringMember, setIsRegisteringMember] = useState(false);

 const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

 // New state for managing barcode input focus
 const [focusBarcodeTrigger, setFocusBarcodeTrigger] = useState(false);

 useEffect(() => {
    // Initial focus trigger when component mounts
    setFocusBarcodeTrigger(true);
 }, []);

 // useEffect to handle focusing the barcode input
 useEffect(() => {
    const inputIsDisabled = isLoadingProduct || isCheckingOut;
    if (focusBarcodeTrigger && barcodeInputRef.current && !inputIsDisabled) {
      barcodeInputRef.current.focus();
      setFocusBarcodeTrigger(false); // Reset the trigger
    }
 }, [focusBarcodeTrigger, isLoadingProduct, isCheckingOut]); // Rerun if trigger or disabled state changes

 useEffect(() => {
    if (!toast.show || toast.type === 'success') {
      setCheckoutError("");
    }
 }, [cart, scannedProduct, toast.show, toast.type]);

 const fetchRecentTransactions = useCallback(async () => {
    if (!user) return;
    setIsLoadingRecentTx(true);
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
        setToast({ show: true, message: `Error loading recent sales: ${data.message || 'Unknown error'}`, type: 'error' });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
      }
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      setToast({ show: true, message: `Error loading recent sales: ${error.message || 'Network error'}`, type: 'error' });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    } finally {
      setIsLoadingRecentTx(false);
    }
 }, [user]);

 useEffect(() => {
    if (user) {
      fetchRecentTransactions();
    }
 }, [user, fetchRecentTransactions]);

 const addItemToCart = useCallback((productToAdd, quantity) => {
    if (!productToAdd || productToAdd.currentStock <= 0) {
      setProductError(productToAdd ? `"${productToAdd.name}" is out of stock.` : 'No product to add.');
      return false;
    }
    const qtyToAdd = parseInt(quantity, 10);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      setProductError("Invalid quantity.");
      return false;
    }

    let success = true;
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.barcode === productToAdd.barcode);
      const stockInRtdb = productToAdd.currentStock;
      let currentCartQuantity = 0;
      if (existingItemIndex !== -1) {
        currentCartQuantity = prevCart[existingItemIndex].quantityInCart;
      }

      if (currentCartQuantity + qtyToAdd > stockInRtdb) {
        setProductError(`Not enough stock for "${productToAdd.name}". Available: ${stockInRtdb - currentCartQuantity}.`);
        success = false;
        return prevCart;
      }
      setProductError('');

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
    return success;
 }, []); // Removed setCart, setProductError as they are stable setters from useState

 const processBarcodeSubmission = useCallback(async (barcodeToProcess) => {
    if (isLoadingProduct) return;

    setIsLoadingProduct(true);
    if (!toast.show || toast.type === 'success') setCheckoutError("");
    setScannedProduct(null);
    // productError is handled by addItemToCart or specific conditions below

    try {
      const productRefPath = `productsInfo/${barcodeToProcess.trim()}`;
      const productDatabaseRef = ref(rtdb, productRefPath);
      const snapshot = await get(productDatabaseRef);

      if (snapshot.exists()) {
        const productData = snapshot.val();
        if (productData.currentStock > 0) {
          const productToAdd = { barcode: barcodeToProcess.trim(), ...productData };
          if (addItemToCart(productToAdd, manualQuantity)) {
            setScannedProduct(productToAdd);
            setProductError(""); 
          }
          setManualQuantity(1);
        } else {
          setProductError(`Product "${productData.name}" is out of stock.`);
          setScannedProduct({ barcode: barcodeToProcess.trim(), ...productData, isOutOfStock: true });
        }
      } else {
        setProductError(`Product with barcode "${barcodeToProcess.trim()}" not found.`);
      }
    } catch (error) {
      console.error("Error fetching product from RTDB:", error);
      setProductError('Error fetching product details. Please try again.');
    } finally {
      setIsLoadingProduct(false);
      setBarcode(''); 
      setFocusBarcodeTrigger(true); // Trigger focus via useEffect
    }
 }, [rtdb, manualQuantity, addItemToCart, isLoadingProduct, toast.show, toast.type, setScannedProduct, setProductError, setManualQuantity, setIsLoadingProduct, setBarcode, setCheckoutError]); // Added setters to dep array

 useEffect(() => {
    clearTimeout(debounceTimerRef.current);

    if (barcode && barcode.trim() !== "" && !isCheckingOut && !isLoadingProduct) {
      debounceTimerRef.current = setTimeout(() => {
        if (barcodeInputRef.current && barcodeInputRef.current.value.trim() !== "") {
          processBarcodeSubmission(barcodeInputRef.current.value);
        }
      }, SCAN_DEBOUNCE_DELAY);
    }

    return () => {
      clearTimeout(debounceTimerRef.current);
    };
 }, [barcode, isCheckingOut, isLoadingProduct, processBarcodeSubmission]);


 const updateCartItemQuantity = (barcodeOfItem, newQuantity) => {
    setCart(prevCart => {
      const itemIndex = prevCart.findIndex(item => item.barcode === barcodeOfItem);
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
        return prevCart.filter(item => item.barcode !== barcodeOfItem);
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
      const memberDbRefRTDB = ref(rtdb, memberRefPath);
      const rtdbSnapshot = await get(memberDbRefRTDB);

      if (rtdbSnapshot.exists()) {
        const memberDataRTDB = rtdbSnapshot.val();
        setCurrentMember({
          id: memberDataRTDB.memberId,
          name: memberDataRTDB.name,
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
        setToast({ show: true, message: "Member registered successfully!", type: 'success' });
        setTimeout(() => setToast(prev => ({...prev, show: false})), 3000);
      } else {
        if (response.status === 409 || (data.message && data.message.toLowerCase().includes("already exist"))) {
            setMemberLookupError(data.message || "This phone number is already registered.");
            setShowRegisterMemberForm(false); // Keep form open if user wants to try again maybe? Or close it. User choice.
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

 const handleNewSale = () => {
    setCart([]);
    setScannedProduct(null);
    setProductError('');
    setCheckoutError('');
    setIsCheckingOut(false);
    setBarcode('');
    setManualQuantity(1);
    clearMemberInfo();
    setCustomerPhoneNumber("");
    setFocusBarcodeTrigger(true); // Trigger focus via useEffect
 };

 const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutError("Cart is empty. Please add items to checkout.");
      return;
    }
    if (!user) {
      setToast({ show: true, message: "User not authenticated. Please log in again.", type: 'error' });
      setTimeout(() => setToast(prev => ({...prev, show: false})), 3000);
      return;
    }

    setIsCheckingOut(true);
    setCheckoutError('');
    setProductError('');

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

      setToast({
          show: true,
          message: `Checkout Successful! Tx ID: ${data.transaction.transactionId}. Total: ${formatCurrency(data.transaction.grandTotal)}`,
          type: 'success'
      });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);

      handleNewSale(); 
      fetchRecentTransactions();

    } catch (error) {
      console.error("Checkout Error:", error);
      setToast({
          show: true,
          message: `Checkout Failed: ${error.message}`,
          type: 'error'
      });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
       // On checkout failure, still good to refocus for corrections or new scan.
      setFocusBarcodeTrigger(true);
    } finally {
      setIsCheckingOut(false);
      // If handleNewSale isn't called on error, ensure focus is still triggered
      // This is now handled by the setFocusBarcodeTrigger(true) in the catch block if needed.
    }
 };

 const handleSelectTransactionForEdit = (transaction) => setSelectedTxForEdit(transaction);
 const handleCloseEditModal = () => {
    setSelectedTxForEdit(null);
    fetchRecentTransactions();
    setFocusBarcodeTrigger(true); // Refocus after closing modal
 };
 const handleTransactionModified = () => {
    fetchRecentTransactions();
    // Potentially refocus if modal closes automatically or for workflow
    // setFocusBarcodeTrigger(true); // Handled by onClose of modal
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
    <div className="container mx-auto max-w-7xl p-4 relative">
      {toast.show && (
        <div
          className={`fixed top-5 right-5 p-4 rounded-md shadow-lg text-white z-[100]
            ${toast.type === 'success' ? 'bg-blue-600' : ''}
            ${toast.type === 'error' ? 'bg-red-600' : ''}
            ${toast.type === 'info' ? 'bg-gray-700' : ''}
            transition-all duration-300 ease-in-out ${toast.show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
          role="alert"
        >
          <div className="flex justify-between items-center">
            <span>{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, message: '', type: 'info' })}
              className="ml-4 text-xl font-semibold leading-none hover:text-gray-200 focus:outline-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <BarcodeScanner
            barcode={barcode}
            setBarcode={setBarcode}
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
          {scannedProduct && !productError && !scannedProduct.isOutOfStock && cart.find(item => item.barcode === scannedProduct.barcode) && (
             <div className="p-3 bg-green-100 text-green-700 rounded shadow-sm flex items-center text-sm">
               <FiCheckCircle className="mr-2 h-5 w-5 flex-shrink-0"/> {`Product "${scannedProduct.name}" processed.`}
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
                      disabled={isLookingUpMember || showRegisterMemberForm || isCheckingOut || isLoadingProduct}
                      maxLength={10}
                    />
                  </div>
                  <button
                    onClick={handleLookupMember}
                    disabled={isLookingUpMember || !customerPhoneNumber || customerPhoneNumber.length < 10 || isCheckingOut || isLoadingProduct}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow disabled:opacity-50 h-[42px] flex items-center min-w-[100px] justify-center"
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
                        disabled={isRegisteringMember || isCheckingOut || isLoadingProduct}
                      />
                    </div>
                    <div className="flex space-x-2">
                        <button
                            type="submit"
                            disabled={isRegisteringMember || !memberName || isCheckingOut || isLoadingProduct}
                            className="flex-1 p-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow disabled:opacity-50 flex items-center justify-center"
                        >
                            {isRegisteringMember ? <LoadingSpinner size="sm" color="text-white" /> : <FiUserPlus size={18} />}
                            <span className="ml-2">Register</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowRegisterMemberForm(false); setMemberLookupError(""); setMemberName(""); }}
                            className="flex-1 p-2 text-sm text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50"
                            disabled={isRegisteringMember || isCheckingOut || isLoadingProduct}
                        >
                            Cancel
                        </button>
                    </div>
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
          {checkoutError && !toast.show && (
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
                disabled={cart.length === 0 || isCheckingOut || isLoadingProduct}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50"
              >
                {isCheckingOut ? <LoadingSpinner size="sm" color="text-white mr-2"/> : <FiShoppingCart className="mr-2 h-5 w-5"/>}
                {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <RecentTransactions
          transactions={recentTransactions}
          onSelectTransactionForEdit={handleSelectTransactionForEdit}
          isLoading={isLoadingRecentTx}
        />
      </div>
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