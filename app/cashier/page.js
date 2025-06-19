// app/cashier/page.js
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { rtdb, ref as rtdbRef } from '@/lib/firebase'; 
import { get } from 'firebase/database';

import BarcodeScanner from '@/app/components/cashier/BarcodeScanner';
import PriceSearchResultsDisplay from '@/app/components/cashier/PriceSearchResultsDisplay';
import CartDisplay from '@/app/components/cashier/CartDisplay';
import CustomerLookup from '@/app/components/cashier/CustomerLookup';
import RecentTransactions from '@/app/components/cashier/RecentTransactions';
import ReturnEditModal from '@/app/components/cashier/ReturnEditModal';
// RegisterMemberForCheckoutModal is removed as per your request
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import {
  FiXCircle, FiCheckCircle, FiShoppingCart, FiDollarSign, FiTrash2,
  FiPlusSquare, FiMinusSquare, FiAlertTriangle, FiPrinter,
  FiUserPlus, FiPhone, FiSearch as FiSearchUser, FiUsers, FiSave
} from 'react-icons/fi';

const formatCurrency = (amount) => {
  return "Rs. " + new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'NPR', minimumFractionDigits: 0, maximumFractionDigits: 0 })
    .format(amount || 0)
    .replace("NPR", "")
    .trim();
};

const SCAN_DEBOUNCE_DELAY = 300;

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
  const [isLoadingRecentTx, setIsLoadingRecentTx] = useState(true);
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
  const [focusBarcodeTrigger, setFocusBarcodeTrigger] = useState(false);

  const [priceSearchQuery, setPriceSearchQuery] = useState("");
  const [productsFoundByPrice, setProductsFoundByPrice] = useState([]);
  const [isSearchingPrice, setIsSearchingPrice] = useState(false);
  const [priceSearchError, setPriceSearchError] = useState("");

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, duration);
  };

  useEffect(() => {
    setFocusBarcodeTrigger(true); 
  }, []);

  useEffect(() => {
    const inputIsDisabled = isLoadingProduct || isCheckingOut || isLookingUpMember || isRegisteringMember ||
      showRegisterMemberForm || isSearchingPrice;
    if (focusBarcodeTrigger && barcodeInputRef.current && !inputIsDisabled) {
      barcodeInputRef.current.focus();
      setFocusBarcodeTrigger(false);
    }
  }, [focusBarcodeTrigger, isLoadingProduct, isCheckingOut, isLookingUpMember, isRegisteringMember, showRegisterMemberForm, isSearchingPrice]);

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
        showToast(`Error loading recent sales: ${data.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showToast(`Error loading recent sales: ${error.message || 'Network error'}`, 'error');
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
    setProductError('');
    if (!productToAdd || productToAdd.currentStock <= 0) {
      const errorMessage = productToAdd ? `"${productToAdd.name}" is out of stock.` : 'No product to add.';
      setProductError(errorMessage);
      showToast(errorMessage, 'error');
      return false;
    }
    const qtyToAdd = parseInt(quantity, 10);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      setProductError("Invalid quantity.");
      showToast("Invalid quantity.", 'error');
      return false;
    }

    let success = true;
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.barcode === productToAdd.barcode);
      const stockAvailable = productToAdd.currentStock;
      let currentCartQuantity = 0;
      if (existingItemIndex !== -1) {
        currentCartQuantity = prevCart[existingItemIndex].quantityInCart;
      }

      if (currentCartQuantity + qtyToAdd > stockAvailable) {
        const errorMessage = `Not enough stock for "${productToAdd.name}". Available: ${stockAvailable - currentCartQuantity}.`;
        setProductError(errorMessage);
        showToast(errorMessage, 'error');
        success = false;
        return prevCart;
      }
      
      showToast(`Added ${qtyToAdd} x ${productToAdd.name} to cart.`, 'success', 1500);
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
            _id: productToAdd._id,
            barcode: productToAdd.barcode,
            name: productToAdd.name,
            priceAtSale: productToAdd.price,
            quantityInCart: qtyToAdd,
            itemTotal: qtyToAdd * productToAdd.price,
            stockAvailableDB: productToAdd.currentStock 
          },
        ];
      }
    });
    return success;
  }, []);

  const processBarcodeSubmission = useCallback(async (barcodeToProcess) => {
    if (isLoadingProduct || isCheckingOut) return;
    
    setIsLoadingProduct(true);
    setProductError('');
    setScannedProduct(null); 
    setPriceSearchError(''); 
    setProductsFoundByPrice([]); 

    try {
      const productRefPath = `productsInfo/${barcodeToProcess.trim()}`;
      const productDatabaseRef = rtdbRef(rtdb, productRefPath);
      const snapshot = await get(productDatabaseRef);

      if (snapshot.exists()) {
        const productData = snapshot.val();
        const productToAdd = { 
            _id: productData._id || null, 
            barcode: barcodeToProcess.trim(), 
            ...productData 
        };
        setScannedProduct(productToAdd);
        
        if (productData.currentStock > 0) {
          if (addItemToCart(productToAdd, manualQuantity)) {
            setBarcode(''); 
            setManualQuantity(1);
          }
        } else {
          setProductError(`"${productData.name}" is out of stock.`);
          showToast(`"${productData.name}" is out of stock.`, 'error');
        }
      } else {
        setProductError(`Product with barcode "${barcodeToProcess.trim()}" not found.`);
        showToast(`Product with barcode "${barcodeToProcess.trim()}" not found.`, 'error');
      }
    } catch (error) {
      console.error("Error fetching product from RTDB:", error);
      setProductError('Error fetching product details. Please try again.');
      showToast('Error fetching product details.', 'error');
    } finally {
      setIsLoadingProduct(false);
      setFocusBarcodeTrigger(true);
    }
  }, [rtdb, manualQuantity, addItemToCart, isLoadingProduct, isCheckingOut]);

  useEffect(() => {
    clearTimeout(debounceTimerRef.current);
    if (barcode && barcode.trim() !== "" && !isCheckingOut && !isLoadingProduct && !isSearchingPrice) {
      setPriceSearchError('');
      setProductsFoundByPrice([]);

      debounceTimerRef.current = setTimeout(() => {
        if (barcodeInputRef.current && barcodeInputRef.current.value.trim() !== "") {
          processBarcodeSubmission(barcodeInputRef.current.value);
        } else {
          processBarcodeSubmission(barcode);
        }
      }, SCAN_DEBOUNCE_DELAY);
    }
    return () => {
      clearTimeout(debounceTimerRef.current);
    };
  }, [barcode, isCheckingOut, isLoadingProduct, isSearchingPrice, processBarcodeSubmission]);


  const updateCartItemQuantity = (barcodeOfItem, newQuantity) => {
    setCart(prevCart => {
      const itemIndex = prevCart.findIndex(item => item.barcode === barcodeOfItem);
      if (itemIndex === -1) return prevCart;

      const itemToUpdate = prevCart[itemIndex];
      if (newQuantity > itemToUpdate.stockAvailableDB) {
        showToast(`Max stock for "${itemToUpdate.name}" is ${itemToUpdate.stockAvailableDB}.`, 'error');
        return prevCart;
      }

      if (newQuantity <= 0) {
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
    setProductError('');
  };
  
  const removeItemFromCart = (barcodeToRemove) => {
    setCart(prevCart => prevCart.filter(item => item.barcode !== barcodeToRemove));
    setProductError("");
  };

  const handlePriceSearch = async () => {
    if (!priceSearchQuery.trim()) {
      setPriceSearchError("Please enter a price to search.");
      showToast("Please enter a price to search.", "error");
      return;
    }
    const priceToSearch = parseFloat(priceSearchQuery.trim());
    if (isNaN(priceToSearch) || priceToSearch < 0) {
      setPriceSearchError("Invalid price amount.");
      showToast("Invalid price amount.", "error");
      return;
    }

    setIsSearchingPrice(true);
    setPriceSearchError("");
    setProductsFoundByPrice([]);
    setProductError(''); 
    setBarcode(''); 
    setScannedProduct(null); 

    try {
      if (!user) {
        throw new Error("User not authenticated.");
      }
      const token = await user.getIdToken();
      const response = await fetch(`/api/products/by-price?price=${priceToSearch}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products by price.');
      }

      if (data.success && data.products.length > 0) {
        setProductsFoundByPrice(data.products);
        showToast(`${data.products.length} product(s) found for Rs. ${priceToSearch}.`, 'info', 4000);
      } else if (data.success && data.products.length === 0) {
        setPriceSearchError(`No products found for Rs. ${priceToSearch}. Try a different price or use barcode scan.`);
        showToast(`No products found for Rs. ${priceToSearch}.`, 'info', 4000);
      } else {
        setPriceSearchError(data.message || 'Could not retrieve products.');
        showToast(data.message || 'Could not retrieve products.', 'error');
      }
    } catch (error) {
      console.error("Error searching products by price:", error);
      setPriceSearchError(error.message || 'An error occurred during price search.');
      showToast(error.message || 'An error occurred during price search.', 'error');
    } finally {
      setIsSearchingPrice(false);
      setFocusBarcodeTrigger(true); 
    }
  };

  const handleSelectProductFromPriceSearch = (productFromSearch) => {
    if (addItemToCart(productFromSearch, manualQuantity)) {
      setProductsFoundByPrice([]); 
      setPriceSearchQuery("");    
      setPriceSearchError("");
      setManualQuantity(1);       
      setFocusBarcodeTrigger(true); 
    }
  };
  
  const explicitBarcodeSearch = () => {
    if (barcode && barcode.trim() !== "") {
      setProductsFoundByPrice([]); 
      setPriceSearchQuery("");
      setPriceSearchError("");
      processBarcodeSubmission(barcode.trim());
    }
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
    setMemberName(""); 
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/members/lookup?phoneNumber=${customerPhoneNumber.trim()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.success && data.member) {
        setCurrentMember(data.member);
        showToast(`Member ${data.member.name} found.`, 'success', 1500);
        setCustomerPhoneNumber(data.member.phoneNumber); 
      } else if (data.success && !data.member) {
        setMemberLookupError("Member not found. You can register them below if needed.");
        setShowRegisterMemberForm(true); 
      } else {
        setMemberLookupError(data.message || "Failed to lookup member. Please try again.");
        setShowRegisterMemberForm(false);
      }
    } catch (error) {
      setMemberLookupError(error.message || "Error looking up member. Check connection or try again.");
    } finally {
      setIsLookingUpMember(false);
      setFocusBarcodeTrigger(true); 
    }
  };

  const handleCancelRegistrationFromLookup = () => {
    setShowRegisterMemberForm(false);
    setMemberLookupError(""); 
    setMemberName("");
    setFocusBarcodeTrigger(true);
  };
  
  const handleRegisterMemberFromLookup = async (nameForRegister, phoneForRegister) => {
    if (!user) {
      setMemberLookupError("Authentication error. Please re-login.");
      showToast("Authentication error. Please re-login.", "error");
      return Promise.reject(new Error("Authentication error."));
    }
    if (!nameForRegister.trim()) {
      setMemberLookupError("Name is required for registration.");
      showToast("Name is required for registration.", "error");
      return Promise.reject(new Error("Name is required."));
    }
    
    setIsRegisteringMember(true);
    setMemberLookupError(""); 
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/members/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: nameForRegister, phoneNumber: phoneForRegister, registrationSource: 'cashier_panel' }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.member) {
        throw new Error(data.message || "Failed to register member.");
      }
      
      showToast(`Member ${data.member.name} registered successfully!`, 'success', 2000);
      setCurrentMember({_id: data.member.id, ...data.member});
      setShowRegisterMemberForm(false); 
      setMemberName(""); 
      setMemberLookupError(""); 
      setCustomerPhoneNumber(data.member.phoneNumber);
      return Promise.resolve(data.member);
    } catch (err) {
      setMemberLookupError(err.message || "An unexpected error occurred during registration.");
      showToast(err.message || "Registration failed.", "error");
      return Promise.reject(err);
    } finally {
      setIsRegisteringMember(false);
      setFocusBarcodeTrigger(true);
    }
  };
  
  const clearMemberInfo = () => {
    setCurrentMember(null);
    setCustomerPhoneNumber(""); 
    setMemberLookupError("");
    setShowRegisterMemberForm(false);
    setIsLookingUpMember(false);
    setIsRegisteringMember(false);
    setMemberName("");
    setFocusBarcodeTrigger(true);
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
    setPriceSearchQuery('');
    setProductsFoundByPrice([]);
    setPriceSearchError('');
    showToast('New sale started. All fields cleared.', 'info', 1500);
    setFocusBarcodeTrigger(true);
  };

  const proceedWithCheckout = async (memberIdForCheckout) => {
    setIsCheckingOut(true);
    setCheckoutError('');
    setProductError('');
    try {
      const token = await user.getIdToken();
      const payload = {
        cart: cart,
        paymentMethod: 'cash',
        memberId: memberIdForCheckout,
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
      showToast(`Checkout Successful! Tx ID: ${data.transaction.transactionId}. Total: ${formatCurrency(data.transaction.grandTotal)}`, 'success', 5000);
      handleNewSale(); 
      fetchRecentTransactions();
    } catch (error) {
      showToast(`Checkout Failed: ${error.message}`, 'error', 5000);
      setCheckoutError(error.message);
    } finally {
      setIsCheckingOut(false);
      setFocusBarcodeTrigger(true);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast("Cart is empty. Please add items to checkout.", 'error');
      return;
    }
    if (!user) {
      showToast("User not authenticated. Please log in again.", 'error');
      return;
    }
    await proceedWithCheckout(currentMember ? (currentMember._id || currentMember.id) : null);
  };
  
  const handleSelectTransactionForEdit = (transaction) => setSelectedTxForEdit(transaction);
  const handleCloseEditModal = () => {
    setSelectedTxForEdit(null);
    fetchRecentTransactions();
    setFocusBarcodeTrigger(true);
  };
  const handleTransactionModified = () => {
    fetchRecentTransactions();
  };

  const combinedIsLoading = isLoadingProduct || isCheckingOut || isLookingUpMember || isRegisteringMember || isSearchingPrice;

  return (
    <div className="container mx-auto max-w-screen-2xl p-4 sm:p-6 lg:p-8 relative">
      {toast.show && (
        <div
          className={`fixed top-20 right-5 p-4 rounded-md shadow-xl text-white z-[200] min-w-[250px]
            ${toast.type === 'success' ? 'bg-green-500' : ''}
            ${toast.type === 'error' ? 'bg-red-500' : ''}
            ${toast.type === 'info' ? 'bg-blue-500' : ''}
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
              × {/* HTML entity for '×' (multiplication sign / close icon) */}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <BarcodeScanner
            barcode={barcode}
            setBarcode={setBarcode}
            isLoading={combinedIsLoading}
            inputRef={barcodeInputRef}
            manualQuantity={manualQuantity}
            setManualQuantity={setManualQuantity}
            onSearchClick={explicitBarcodeSearch}
            priceSearchQuery={priceSearchQuery}
            setPriceSearchQuery={setPriceSearchQuery}
            onPriceSearch={handlePriceSearch}
            isSearchingPrice={isSearchingPrice}
          />

          {productError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg shadow-sm flex items-center text-sm border border-red-200">
              <FiAlertTriangle className="mr-2 h-5 w-5 flex-shrink-0"/> {productError}
            </div>
          )}
          
          {priceSearchError && !productError && (
            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg shadow-sm flex items-center text-sm border border-yellow-200">
              <FiAlertTriangle className="mr-2 h-5 w-5 flex-shrink-0"/> {priceSearchError}
            </div>
          )}
          
          {productsFoundByPrice.length > 0 && (
            <PriceSearchResultsDisplay
              products={productsFoundByPrice}
              onSelectProduct={handleSelectProductFromPriceSearch}
              formatCurrency={formatCurrency}
            />
          )}

          <CustomerLookup
            customerPhoneNumber={customerPhoneNumber}
            setCustomerPhoneNumber={setCustomerPhoneNumber}
            onLookupMember={handleLookupMember}
            isLookingUpMember={isLookingUpMember}
            memberLookupError={memberLookupError}
            currentMember={currentMember}
            onClearMember={clearMemberInfo}
            isCheckingOut={isCheckingOut}
            isLoadingProduct={isLoadingProduct || isSearchingPrice}
            showRegisterMemberForm={showRegisterMemberForm}
            onRegisterMemberFromLookup={handleRegisterMemberFromLookup}
            memberName={memberName}
            setMemberName={setMemberName}
            isRegisteringMember={isRegisteringMember}
            onCancelRegistration={handleCancelRegistrationFromLookup}
          />
          
          <CartDisplay
            cart={cart}
            onRemoveItem={removeItemFromCart}
            onUpdateQuantity={updateCartItemQuantity}
            formatCurrency={formatCurrency}
          />

          {cart.length > 0 && (
            <div className="mt-6 p-6 bg-white rounded-xl shadow-lg">
              {currentMember && (
                <p className="text-sm text-blue-600 mb-4 text-center">
                  {'Billing to member: '}<strong>{currentMember.name}</strong>{` (${currentMember.phoneNumber})`}
                </p>
              )}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || isLoadingProduct || isSearchingPrice || cart.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? <LoadingSpinner size="md" color="text-white" /> : <FiShoppingCart className="mr-3 h-6 w-6"/>}
                {isCheckingOut ? 'Processing...' : `Proceed to Checkout (${formatCurrency(cart.reduce((total, item) => total + item.itemTotal, 0))})`}
              </button>
              {checkoutError && <p className="text-red-500 text-sm mt-2 text-center">{checkoutError}</p>}
            </div>
          )}
           <button
                onClick={handleNewSale}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center text-md"
            >
                <FiXCircle className="mr-2 h-5 w-5"/> {'New Sale / Clear All'}
            </button>
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <RecentTransactions
            transactions={recentTransactions}
            onSelectTransactionForEdit={handleSelectTransactionForEdit}
            isLoading={isLoadingRecentTx}
          />
        </div>
      </div>

      {/* RegisterMemberForCheckoutModal is removed */}

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