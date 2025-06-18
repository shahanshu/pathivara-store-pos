// File: app/admin/import-ledger/new/page.js
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiPlus, FiTrash2, FiSearch, FiArrowLeft } from 'react-icons/fi';

const NewImportLedgerPage = () => {
    const { user } = useAuth();
    const router = useRouter();

    const [importers, setImporters] = useState([]);
    const [selectedImporter, setSelectedImporter] = useState('');
    const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [items, setItems] = useState([]);

    // MODIFIED: initialCurrentItemState updated to remove category
    const initialCurrentItemState = {
        barcode: '',
        productName: '',
        quantityImported: '',
        ratePerItem: '',
        isNewProduct: false,
        newProductDetails: { price: '', lowStockThreshold: '10' }, // category removed
        productId: null,
        searched: false,
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
            if (field === 'barcode') {
                newState.searched = false;
                newState.foundProduct = null;
                newState.isNewProduct = false;
                newState.productName = '';
                newState.newProductDetails = initialCurrentItemState.newProductDetails;
            }
            return newState;
        });
        setItemError('');
    };
    
    // MODIFIED: Removed category from this handler
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
        setCurrentItem(prev => ({ ...prev, productName: '', isNewProduct: false, foundProduct: null, newProductDetails: initialCurrentItemState.newProductDetails }));

        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/products/lookup-by-barcode?barcode=${encodeURIComponent(currentItem.barcode.trim())}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            setCurrentItem(prev => ({ ...prev, searched: true }));

            if (!response.ok) throw new Error(data.message || 'Barcode lookup failed');

            if (data.success && data.product) {
                setCurrentItem(prev => ({
                    ...prev,
                    productName: data.product.name,
                    productId: data.product._id,
                    isNewProduct: false,
                    foundProduct: data.product,
                    // MODIFIED: Pre-fill newProductDetails without category
                    newProductDetails: {
                        price: data.product.price != null ? String(data.product.price) : '',
                        lowStockThreshold: (data.product.lowStockThreshold || 10).toString(),
                    }
                }));
            } else {
                setCurrentItem(prev => ({ ...prev, productId: null, isNewProduct: true, foundProduct: null }));
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
        // ... (rest of the validation logic is correct and does not need changes for this request)
        setItemError('');
        if (!currentItem.searched) {
            setItemError('Please search the barcode first by clicking the search icon.');
            return;
        }
        if (!currentItem.barcode.trim() || !currentItem.productName.trim() || !String(currentItem.quantityImported).trim() || !String(currentItem.ratePerItem).trim()) {
            setItemError('Barcode, Product Name, Quantity Imported, and Rate/Item are required.');
            return;
        }
        const quantity = parseFloat(currentItem.quantityImported);
        if (isNaN(quantity) || quantity <= 0) {
            setItemError('Quantity Imported must be a positive number.');
            return;
        }
        // ... rest of validation
        if (currentItem.isNewProduct) {
             if (!currentItem.newProductDetails.price || String(currentItem.newProductDetails.price).trim() === "") {
                setItemError('Selling Price is required for new product ' + currentItem.productName + '.');
                return;
            }
            const sellingPrice = parseFloat(currentItem.newProductDetails.price);
            if (isNaN(sellingPrice) || sellingPrice <= 0) {
                setItemError('Selling Price for new product ' + currentItem.productName + ' must be a positive number.');
                return;
            }
        }
        
        setItems(prev => [...prev, { ...currentItem, id: Date.now() }]);
        setCurrentItem(initialCurrentItemState);
    };

    const handleRemoveItem = (itemId) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // ... (rest of the submit logic is correct and does not need changes for this request)
        if (!user) { setError("User not authenticated. Please login again."); return; }
        if (!selectedImporter || !importDate || items.length === 0) { setError('Please select an importer, set import date, and add at least one item.'); return; }
        
        setIsSubmitting(true);
        // MODIFIED: Payload mapping updated to remove category
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
                        price: parseFloat(parsedItem.newProductDetails.price),
                        lowStockThreshold: parseInt(parsedItem.newProductDetails.lowStockThreshold, 10) || 10,
                        // category removed
                    };
                }
                return parsedItem;
            }),
        };
        // ... rest of submit logic
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/admin/import-ledger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to create import ledger entry.');
            }
            setSuccessMessage(data.message || 'Import ledger entry created successfully!');
            setTimeout(() => router.push('/admin/import-ledger'), 2000);
        } catch(err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Record New Import</h1>
                <Link href="/admin/import-ledger" className="text-indigo-600 hover:text-indigo-800 inline-flex items-center">
                    <FiArrowLeft className="mr-1"/> Back to Import Ledger List
                </Link>
            </div>
            {error && <p className="mb-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            {successMessage && <p className="mb-4 text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                {/* Importer Details form part is unchanged */}
                {/* ... */}
                
                {/* Item Entry Section */}
                <div className="border-t pt-6 mt-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-3">Add Items to Import</h2>
                    {itemError && <p className="mb-3 text-red-500 text-sm">{itemError}</p>}
                    <div className="space-y-3 p-4 border rounded-md bg-gray-50">
                        {/* ... barcode, product name, qty, rate inputs are unchanged ... */}
                        
                        {/* MODIFIED: Conditional rendering for New Product Details updated */}
                        {currentItem.searched && currentItem.isNewProduct && (
                            <div className="mt-2 p-3 border border-blue-300 rounded-md bg-blue-50 space-y-2">
                                <p className="text-sm font-medium text-blue-700">New Product Details (Barcode: {currentItem.barcode}):</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2"> {/* Changed from 3 to 2 cols */}
                                    <div>
                                        <label htmlFor="newPrice" className="block text-xs text-gray-600">Selling Price *</label>
                                        <input type="number" id="newPrice" value={currentItem.newProductDetails.price}
                                            onChange={(e) => handleNewProductDetailsChange('price', e.target.value)} min="0.01"
                                            step="0.01" required={currentItem.isNewProduct}
                                            className="mt-0.5 w-full px-2 py-1 border border-gray-300 rounded-md sm:text-xs"/>
                                    </div>
                                    {/* Category input div is removed */}
                                    <div>
                                        <label htmlFor="newLowStock" className="block text-xs text-gray-600">Low Stock Threshold</label>
                                        <input type="number" id="newLowStock" value={currentItem.newProductDetails.lowStockThreshold}
                                            onChange={(e) => handleNewProductDetailsChange('lowStockThreshold', e.target.value)}
                                            min="0" step="1"
                                            className="mt-0.5 w-full px-2 py-1 border border-gray-300 rounded-md sm:text-xs"/>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* ... Add Item button ... */}
                    </div>
                </div>
                {/* ... Items List and Submit Button ... */}
            </form>
        </div>
    );
};

export default NewImportLedgerPage;