// File: app/admin/import-ledger/new/page.js
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiPlus, FiTrash2, FiSearch, FiArrowLeft, FiSave, FiTag } from 'react-icons/fi';

const NewImportLedgerPage = () => {
    const { user } = useAuth();
    const router = useRouter();

    const [importers, setImporters] = useState([]);
    const [selectedImporter, setSelectedImporter] = useState('');
    const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [items, setItems] = useState([]);

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
            if (!user) {
                setError("User not authenticated. Please login.");
                setIsLoadingImporters(false);
                return;
            }
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
                newState.newProductDetails = { ...initialCurrentItemState.newProductDetails };
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
        if (!user) {
            setItemError("Authentication error. Please re-login.");
            return;
        }
        setIsSearchingBarcode(true);
        setItemError('');
        setCurrentItem(prev => ({ 
            ...prev, 
            productName: '', 
            isNewProduct: false, 
            foundProduct: null, 
            newProductDetails: {...initialCurrentItemState.newProductDetails},
            searched: false 
        }));

        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/products/lookup-by-barcode?barcode=${encodeURIComponent(currentItem.barcode.trim())}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.message || 'Barcode lookup failed');

            if (data.success && data.product) {
                setCurrentItem(prev => ({
                    ...prev,
                    productName: data.product.name,
                    productId: data.product._id,
                    isNewProduct: false,
                    foundProduct: data.product,
                    newProductDetails: { 
                        price: data.product.price != null ? String(data.product.price) : '',
                        lowStockThreshold: (data.product.lowStockThreshold || 10).toString(),
                    },
                    searched: true,
                }));
            } else {
                setCurrentItem(prev => ({ ...prev, productId: null, isNewProduct: true, foundProduct: null, searched: true }));
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
        const rate = parseFloat(currentItem.ratePerItem);
        if (isNaN(rate) || rate < 0) { 
            setItemError('Rate/Item must be a non-negative number.');
            return;
        }

        if (currentItem.isNewProduct) {
            if (!currentItem.newProductDetails.price || String(currentItem.newProductDetails.price).trim() === "") {
                setItemError(`Selling Price is required for new product '${currentItem.productName}'.`);
                return;
            }
            const sellingPrice = parseFloat(currentItem.newProductDetails.price);
            if (isNaN(sellingPrice) || sellingPrice <= 0) {
                setItemError(`Selling Price for new product '${currentItem.productName}' must be a positive number.`);
                return;
            }
            const lowStock = parseInt(currentItem.newProductDetails.lowStockThreshold, 10);
            if (isNaN(lowStock) || lowStock < 0) {
                setItemError('Low Stock Threshold must be a non-negative number.');
                return;
            }
        }
        
        const itemToAdd = { ...currentItem, id: Date.now() + Math.random() }; 
        setItems(prev => [...prev, itemToAdd]);
        setCurrentItem(initialCurrentItemState); 
    };

    const handleRemoveItem = (itemId) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) { setError("User not authenticated. Please login again."); return; }
        if (!selectedImporter || !importDate || items.length === 0) {
            setError('Please select an importer, set import date, and add at least one item.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');

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
                    };
                } else if (!parsedItem.isNewProduct) {
                    delete parsedItem.newProductDetails;
                }
                return parsedItem;
            }),
        };

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
            setSelectedImporter('');
            setImportDate(new Date().toISOString().split('T')[0]);
            setInvoiceNumber('');
            setItems([]);
            setCurrentItem(initialCurrentItemState);
            setTimeout(() => router.push('/admin/import-ledger'), 2000); 
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'NPR', 
        }).format(amount || 0);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Record New Import</h1>
                <Link href="/admin/import-ledger" className="text-indigo-600 hover:text-indigo-800 inline-flex items-center">
                    <FiArrowLeft className="mr-1" /> Back to Import Ledger List
                </Link>
            </div>

            {error && <p className="mb-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            {successMessage && <p className="mb-4 text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                {/* Importer Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="importer" className="block text-sm font-medium text-gray-700">Importer <span className="text-red-500">*</span></label>
                        {isLoadingImporters ? (
                            <div className="mt-1 flex items-center text-sm text-gray-500"><LoadingSpinner size="sm" /> Loading importers...</div>
                        ) : (
                        <select
                            id="importer"
                            value={selectedImporter}
                            onChange={(e) => setSelectedImporter(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">Select Importer</option>
                            {importers.map(imp => (
                                <option key={imp._id} value={imp._id}>{imp.name} ({imp.panNumber})</option>
                            ))}
                        </select>
                        )}
                    </div>
                    <div>
                        <label htmlFor="importDate" className="block text-sm font-medium text-gray-700">Import Date <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            id="importDate"
                            value={importDate}
                            onChange={(e) => setImportDate(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700">Invoice Number</label>
                        <input
                            type="text"
                            id="invoiceNumber"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Optional"
                        />
                    </div>
                </div>

                {/* Item Entry Section */}
                <div className="border-t pt-6 mt-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-3">Add Items to Import</h2>
                    {itemError && <p className="mb-3 text-red-500 bg-red-50 p-2 rounded-md text-sm">{itemError}</p>}
                    
                    <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"> {/* Adjusted to 12 cols for finer control */}
                            <div className="md:col-span-3"> {/* Barcode */}
                                <label htmlFor="barcode" className="block text-xs font-medium text-gray-600">Barcode <span className="text-red-500">*</span></label>
                                <div className="mt-0.5 flex rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        id="barcode"
                                        value={currentItem.barcode}
                                        onChange={(e) => handleCurrentItemChange('barcode', e.target.value)}
                                        className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 px-3 py-2"
                                        placeholder="Scan or type barcode"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearchBarcode}
                                        disabled={isSearchingBarcode || !currentItem.barcode.trim()}
                                        className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                                    >
                                        {isSearchingBarcode ? <LoadingSpinner size="xs" /> : <FiSearch className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-3"> {/* Product Name */}
                                <label htmlFor="productName" className="block text-xs font-medium text-gray-600">Product Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="productName"
                                    value={currentItem.productName}
                                    onChange={(e) => handleCurrentItemChange('productName', e.target.value)}
                                    readOnly={!currentItem.isNewProduct && currentItem.foundProduct} 
                                    className={`mt-0.5 w-full px-3 py-2 border border-gray-300 rounded-md sm:text-xs ${(!currentItem.isNewProduct && currentItem.foundProduct) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                            </div>
                             <div className="md:col-span-2"> {/* Quantity */}
                                <label htmlFor="quantityImported" className="block text-xs font-medium text-gray-600">Quantity Imp. <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    id="quantityImported"
                                    value={currentItem.quantityImported}
                                    onChange={(e) => handleCurrentItemChange('quantityImported', e.target.value)}
                                    min="1"
                                    className="mt-0.5 w-full px-3 py-2 border border-gray-300 rounded-md sm:text-xs"
                                />
                            </div>
                            <div className="md:col-span-2"> {/* Rate */}
                                <label htmlFor="ratePerItem" className="block text-xs font-medium text-gray-600">Rate/Item <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    id="ratePerItem"
                                    value={currentItem.ratePerItem}
                                    onChange={(e) => handleCurrentItemChange('ratePerItem', e.target.value)}
                                    step="0.01" min="0"
                                    className="mt-0.5 w-full px-3 py-2 border border-gray-300 rounded-md sm:text-xs"
                                />
                            </div>
                            <div className="md:col-span-2"> {/* Add Item Button */}
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="w-full mt-4 sm:mt-0 inline-flex justify-center items-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" // Adjusted padding
                                >
                                    <FiPlus className="mr-2 h-4 w-4" /> Add Item
                                </button>
                            </div>
                        </div>
                        
                        {currentItem.searched && currentItem.isNewProduct && (
                            <div className="mt-3 p-3 border border-blue-300 rounded-md bg-blue-50 space-y-2">
                                <p className="text-sm font-medium text-blue-700 flex items-center">
                                    <FiTag className="mr-2 h-4 w-4"/> New Product Details (Barcode: {currentItem.barcode}):
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="newPrice" className="block text-xs text-gray-600">Selling Price <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            id="newPrice"
                                            value={currentItem.newProductDetails.price}
                                            onChange={(e) => handleNewProductDetailsChange('price', e.target.value)}
                                            min="0.01" step="0.01" required={currentItem.isNewProduct}
                                            className="mt-0.5 w-full px-2 py-1 border border-gray-300 rounded-md sm:text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="newLowStock" className="block text-xs text-gray-600">Low Stock Threshold</label>
                                        <input
                                            type="number"
                                            id="newLowStock"
                                            value={currentItem.newProductDetails.lowStockThreshold}
                                            onChange={(e) => handleNewProductDetailsChange('lowStockThreshold', e.target.value)}
                                            min="0" step="1"
                                            className="mt-0.5 w-full px-2 py-1 border border-gray-300 rounded-md sm:text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items List Section */}
                {items.length > 0 && (
                    <div className="mt-6 border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Items to Import ({items.length})</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Imp.</th>
                                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                                        <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.barcode} {item.isNewProduct && <span className="ml-1 text-xs text-blue-500 font-semibold">(New)</span>}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.productName}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantityImported}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(parseFloat(item.ratePerItem))}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right font-medium">{formatCurrency(parseFloat(item.ratePerItem) * parseInt(item.quantityImported))}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                                <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50">
                                                    <FiTrash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         <div className="mt-4 text-right font-semibold text-gray-700 text-lg">
                            Grand Total Cost: {formatCurrency(items.reduce((sum, item) => sum + (parseFloat(item.ratePerItem || 0) * parseInt(item.quantityImported || 0)), 0))}
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="pt-6 border-t mt-6">
                    <button
                        type="submit"
                        disabled={isSubmitting || items.length === 0 || !selectedImporter || !importDate}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <LoadingSpinner size="sm" color="text-white mr-2" /> : <FiSave className="mr-2 h-5 w-5"/>}
                        {isSubmitting ? 'Submitting Import...' : 'Create Import Ledger Entry'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewImportLedgerPage;