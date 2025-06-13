'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiPlus, FiTrash2, FiSearch } from 'react-icons/fi';

const NewImportLedgerPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [importers, setImporters] = useState([]);
  const [selectedImporter, setSelectedImporter] = useState('');
  const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  const [items, setItems] = useState([]);
  const initialCurrentItemState = { // Define initial state for easy reset
    barcode: '',
    productName: '',
    quantityImported: '',
    ratePerItem: '',
    isNewProduct: false, // Default to false until search confirms
    newProductDetails: { price: '', category: '', lowStockThreshold: '10' },
    productId: null, 
    searched: false, // CRITICAL: Track if barcode search has been performed
    foundProduct: null,
  };
  const [currentItem, setCurrentItem] = useState(initialCurrentItemState);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingImporters, setIsLoadingImporters] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [itemError, setItemError] = useState('');
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);

  useEffect(() => {
    const fetchImporters = async () => {
      if (!user) return;
      setIsLoadingImporters(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/importers', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Failed to fetch importers');
        setImporters(data.importers);
      } catch (err) {
        setError(`Failed to load importers: ${err.message}`);
      } finally {
        setIsLoadingImporters(false);
      }
    };
    fetchImporters();
  }, [user]);

  const handleCurrentItemChange = (field, value) => {
    setCurrentItem(prev => {
      const newState = { ...prev, [field]: value };
      // If barcode is changed, reset search-related fields
      if (field === 'barcode') {
        newState.searched = false;
        newState.foundProduct = null;
        newState.isNewProduct = false; // Reset this, search will determine
        newState.productName = ''; // Clear product name if barcode changes
        newState.newProductDetails = initialCurrentItemState.newProductDetails; // Reset new product details
      }
      return newState;
    });
    setItemError('');
  };

  const handleNewProductDetailsChange = (field, value) => {
    setCurrentItem(prev => ({
      ...prev,
      newProductDetails: { ...prev.newProductDetails, [field]: value },
    }));
  };

  const handleSearchBarcode = async () => {
    if (!currentItem.barcode.trim()) {
      setItemError('Please enter a barcode to search.');
      return;
    }
    setIsSearchingBarcode(true);
    setItemError('');
    setCurrentItem(prev => ({ ...prev, productName: '', isNewProduct: false, foundProduct: null, newProductDetails: initialCurrentItemState.newProductDetails })); // Optimistic reset

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/products/lookup-by-barcode?barcode=${encodeURIComponent(currentItem.barcode.trim())}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      // Mark as searched regardless of outcome
      setCurrentItem(prev => ({ ...prev, searched: true })); 

      if (!response.ok ) throw new Error(data.message || 'Barcode lookup failed');
      
      if (data.success && data.product) {
        setCurrentItem(prev => ({
          ...prev,
          productName: data.product.name,
          productId: data.product._id,
          isNewProduct: false, // Explicitly false
          foundProduct: data.product,
          // Pre-fill newProductDetails even for existing products, in case user changes their mind or for consistency (though they won't be used if isNewProduct is false)
          newProductDetails: { 
            price: data.product.price != null ? String(data.product.price) : '',
            category: data.product.category || '',
            lowStockThreshold: (data.product.lowStockThreshold || 10).toString(),
          }
        }));
      } else { // Product not found or success: false
        setCurrentItem(prev => ({ 
            ...prev, 
            productName: prev.productName, // Keep any typed name if not found
            productId: null, 
            isNewProduct: true, // Explicitly true
            foundProduct: null 
        }));
        setItemError('Product not found. Please enter/confirm details for this new product.');
      }
    } catch (err) {
      setItemError(`Barcode search error: ${err.message}. Assuming new product.`);
      setCurrentItem(prev => ({ ...prev, searched: true, isNewProduct: true, foundProduct: null }));
    } finally {
      setIsSearchingBarcode(false);
    }
  };

  const handleAddItem = () => {
    setItemError('');
    // Check if barcode search has been performed
    if (!currentItem.searched) {
        setItemError('Please search the barcode first by clicking the search icon.');
        return;
    }

    // Basic presence checks
    if (!currentItem.barcode.trim() || !currentItem.productName.trim() || 
        !String(currentItem.quantityImported).trim() || !String(currentItem.ratePerItem).trim()) {
      setItemError('Barcode, Product Name, Quantity Imported, and Rate/Item are required.');
      return;
    }

    const quantity = parseFloat(currentItem.quantityImported);
    const rate = parseFloat(currentItem.ratePerItem);

    if (isNaN(quantity) || quantity <= 0) {
        setItemError('Quantity Imported must be a positive number.');
        return;
    }
    if (isNaN(rate) || rate < 0) {
        setItemError('Rate per Item must be a non-negative number.');
        return;
    }

    // Validate new product details ONLY IF isNewProduct is true (which is set by handleSearchBarcode)
    if (currentItem.isNewProduct) {
        if (!currentItem.newProductDetails.price || String(currentItem.newProductDetails.price).trim() === "") {
            setItemError('Selling Price is required for new product ' + currentItem.productName + '.');
            return; // <<<<< YOUR ERROR IS TRIGGERED HERE
        }
        const sellingPrice = parseFloat(currentItem.newProductDetails.price);
        if (isNaN(sellingPrice) || sellingPrice <= 0) {
            setItemError('Selling Price for new product ' + currentItem.productName + ' must be a positive number.');
            return;
        }
        
        const lowStock = parseInt(currentItem.newProductDetails.lowStockThreshold, 10);
        // Only validate lowStock if it's not empty, as it's optional-ish
        if (String(currentItem.newProductDetails.lowStockThreshold).trim() !== "" && (isNaN(lowStock) || lowStock < 0)) {
            setItemError('Low Stock Threshold for new product ' + currentItem.productName + ' must be a non-negative number.');
            return;
        }
    }

    setItems(prev => [...prev, { ...currentItem, id: Date.now() }]);
    setCurrentItem(initialCurrentItemState); // Reset to completely initial state
  };

  const handleRemoveItem = (itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!user) {
        setError("User not authenticated. Please login again.");
        return;
    }
    if (!selectedImporter || !importDate || items.length === 0) {
      setError('Please select an importer, set import date, and add at least one item.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const payload = {
        importerId: selectedImporter,
        importDate,
        invoiceNumber,
        items: items.map(({ id, searched, foundProduct, ...itemData }) => {
            const parsedItem = {
                ...itemData,
                quantityImported: parseInt(itemData.quantityImported, 10),
                ratePerItem: parseFloat(itemData.ratePerItem),
            };
            if (parsedItem.isNewProduct && parsedItem.newProductDetails) {
                parsedItem.newProductDetails = {
                    ...parsedItem.newProductDetails,
                    price: parseFloat(parsedItem.newProductDetails.price),
                    lowStockThreshold: parseInt(parsedItem.newProductDetails.lowStockThreshold, 10) || 10, // Default to 10 on backend if not provided or NaN
                };
            }
            return parsedItem;
        }),
      };
      
      console.log("CLIENT: Payload being sent to API:", JSON.stringify(payload, null, 2)); 

      const response = await fetch('/api/admin/import-ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create import ledger entry.');
      }
      setSuccessMessage(data.message || 'Import ledger entry created successfully!');
      setSelectedImporter('');
      setImportDate(new Date().toISOString().split('T')[0]);
      setInvoiceNumber('');
      setItems([]);
      setCurrentItem(initialCurrentItemState);
      
      setTimeout(() => router.push('/admin/import-ledger'), 2000);

    } catch (err) {
      console.error("CLIENT SUBMIT ERROR:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Record New Import</h1>
        <Link href="/admin/import-ledger" className="text-indigo-600 hover:text-indigo-800">
          ← Back to Import Ledger List
        </Link>
      </div>

      {error && <p className="mb-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      {successMessage && <p className="mb-4 text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
        {/* Importer Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="importer" className="block text-sm font-medium text-gray-700">Importer *</label>
            {isLoadingImporters ? <LoadingSpinner size="sm"/> : (
              <select id="importer" value={selectedImporter} onChange={(e) => setSelectedImporter(e.target.value)} required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="">Select Importer</option>
                {importers.map(imp => <option key={imp._id} value={imp._id}>{imp.name} ({imp.panNumber})</option>)}
              </select>
            )}
          </div>
          <div>
            <label htmlFor="importDate" className="block text-sm font-medium text-gray-700">Import Date *</label>
            <input type="date" id="importDate" value={importDate} onChange={(e) => setImportDate(e.target.value)} required
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          <div>
            <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700">Invoice Number</label>
            <input type="text" id="invoiceNumber" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
        </div>

        {/* Item Entry Section */}
        <div className="border-t pt-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Add Items to Import</h2>
          {itemError && <p className="mb-3 text-red-500 text-sm">{itemError}</p>}
          
          <div className="space-y-3 p-4 border rounded-md bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-2">
                <label htmlFor="itemBarcode" className="block text-xs font-medium text-gray-700">Barcode *</label>
                <div className="flex">
                    <input type="text" id="itemBarcode" value={currentItem.barcode} 
                           onChange={(e) => handleCurrentItemChange('barcode', e.target.value)}
                           className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-l-md shadow-sm sm:text-sm"/>
                    <button type="button" onClick={handleSearchBarcode} disabled={isSearchingBarcode || !currentItem.barcode.trim()}
                            className="p-1.5 border border-l-0 border-gray-300 bg-gray-100 hover:bg-gray-200 rounded-r-md disabled:opacity-50">
                        {isSearchingBarcode ? <LoadingSpinner size="xs"/> : <FiSearch />}
                    </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="itemName" className="block text-xs font-medium text-gray-700">Product Name *</label>
                <input type="text" id="itemName" value={currentItem.productName} 
                       onChange={(e) => handleCurrentItemChange('productName', e.target.value)}
                       disabled={currentItem.searched && currentItem.foundProduct != null} // Disable if product was found via search
                       className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm sm:text-sm disabled:bg-gray-100"/>
              </div>
              <div>
                <label htmlFor="itemQty" className="block text-xs font-medium text-gray-700">Quantity Imp. *</label>
                <input type="number" id="itemQty" value={currentItem.quantityImported} 
                       onChange={(e) => handleCurrentItemChange('quantityImported', e.target.value)} min="1" step="1"
                       className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
              </div>
              <div>
                <label htmlFor="itemRate" className="block text-xs font-medium text-gray-700">Rate/Item *</label>
                <input type="number" id="itemRate" value={currentItem.ratePerItem} 
                       onChange={(e) => handleCurrentItemChange('ratePerItem', e.target.value)} min="0" step="0.01"
                       className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
              </div>
            </div>

            {/* Conditionally render New Product Details only if barcode has been searched AND it's a new product */}
            {currentItem.searched && currentItem.isNewProduct && (
              <div className="mt-2 p-3 border border-blue-300 rounded-md bg-blue-50 space-y-2">
                <p className="text-sm font-medium text-blue-700">New Product Details (Barcode: {currentItem.barcode}):</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                        <label htmlFor="newPrice" className="block text-xs text-gray-600">Selling Price *</label>
                        <input type="number" id="newPrice" value={currentItem.newProductDetails.price} 
                               onChange={(e) => handleNewProductDetailsChange('price', e.target.value)} min="0.01" step="0.01" required={currentItem.isNewProduct}
                               className="mt-0.5 w-full px-2 py-1 border border-gray-300 rounded-md sm:text-xs"/>
                    </div>
                    <div>
                        <label htmlFor="newCategory" className="block text-xs text-gray-600">Category</label>
                        <input type="text" id="newCategory" value={currentItem.newProductDetails.category} 
                               onChange={(e) => handleNewProductDetailsChange('category', e.target.value)}
                               className="mt-0.5 w-full px-2 py-1 border border-gray-300 rounded-md sm:text-xs"/>
                    </div>
                    <div>
                        <label htmlFor="newLowStock" className="block text-xs text-gray-600">Low Stock Threshold</label>
                        <input type="number" id="newLowStock" value={currentItem.newProductDetails.lowStockThreshold} 
                               onChange={(e) => handleNewProductDetailsChange('lowStockThreshold', e.target.value)} min="0" step="1"
                               className="mt-0.5 w-full px-2 py-1 border border-gray-300 rounded-md sm:text-xs"/>
                    </div>
                </div>
              </div>
            )}
            <div className="text-right">
                <button type="button" onClick={handleAddItem}
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                  <FiPlus className="mr-1 -ml-0.5"/> Add Item to List
                </button>
            </div>
          </div>
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900">Import Items List</h3>
            <div className="mt-2 flow-root">
              <ul role="list" className="-my-2 divide-y divide-gray-200">
                {items.map((item, index) => (
                  <li key={item.id} className="py-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{index+1}. {item.productName} ({item.barcode})</p>
                      <p className="text-gray-500">
                        Qty: {item.quantityImported} @ ${parseFloat(item.ratePerItem || 0).toFixed(2)} each. 
                        {item.isNewProduct ? ` (New Product - Selling @ $${parseFloat(item.newProductDetails.price || 0).toFixed(2)})` : ''}
                      </p>
                    </div>
                    <button type="button" onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700">
                      <FiTrash2 />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
             <p className="mt-4 text-right font-semibold text-gray-800">
                Total Estimated Cost: ${items.reduce((sum, item) => sum + (parseFloat(item.quantityImported || 0) * parseFloat(item.ratePerItem || 0)), 0).toFixed(2)}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-5">
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting || items.length === 0 || !user}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              {isSubmitting ? <LoadingSpinner size="sm" color="text-white mr-2"/> : null}
              {isSubmitting ? 'Submitting...' : 'Create Import Ledger Entry'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewImportLedgerPage;