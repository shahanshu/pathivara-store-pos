// File: app/admin/products/new/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiArrowLeft } from 'react-icons/fi';

const NewProductPage = () => {
    const [name, setName] = useState("");
    const [barcode, setBarcode] = useState("");
    const [price, setPrice] = useState("");
    const [currentStock, setCurrentStock] = useState(0);
    // MODIFIED: Added state for the new field
    const [totalImported, setTotalImported] = useState(0);
    const [lowStockThreshold, setLowStockThreshold] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError("User not authenticated. Please login again.");
            return;
        }

        setIsSubmitting(true);
        setError("");
        setSuccessMessage("");

        // --- Client-side Validations ---
        if (!name || !price || !barcode) {
            setError('Name, Price and Barcode are required.');
            setIsSubmitting(false);
            return;
        }
        if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            setError('Price must be a positive number.');
            setIsSubmitting(false);
            return;
        }
        const stockInt = parseInt(currentStock, 10);
        if (isNaN(stockInt) || stockInt < 0) {
            setError('Current stock must be a non-negative number.');
            setIsSubmitting(false);
            return;
        }
        // MODIFIED: Validation for new field
        const importedInt = parseInt(totalImported, 10);
        if (isNaN(importedInt) || importedInt < 0) {
            setError('Total Imported must be a non-negative number.');
            setIsSubmitting(false);
            return;
        }
        // MODIFIED: Logical validation
        if (stockInt > importedInt) {
            setError('Current Stock cannot be greater than Total Imported.');
            setIsSubmitting(false);
            return;
        }
        
        if (isNaN(parseInt(lowStockThreshold)) || parseInt(lowStockThreshold) < 0) {
            setError('Low stock threshold must be a non-negative number.');
            setIsSubmitting(false);
            return;
        }

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                // MODIFIED: Payload updated to include totalImported
                body: JSON.stringify({
                    name,
                    barcode,
                    price: parseFloat(price),
                    currentStock: stockInt,
                    totalImportedEver: importedInt,
                    lowStockThreshold: parseInt(lowStockThreshold)
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || `Failed to create product: ${response.status}`);
            }

            setSuccessMessage(`Product "${data.product.name}" created successfully!`);
            // MODIFIED: Clear all fields on success
            setName("");
            setBarcode("");
            setPrice("");
            setCurrentStock(0);
            setTotalImported(0);
            setLowStockThreshold(10);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Add New Product</h1>
                <Link href="/admin/products" className="text-indigo-600 hover:text-indigo-800 inline-flex items-center">
                    <FiArrowLeft className="mr-1" /> Back to Products
                </Link>
            </div>

            {error && <p className="mb-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            {successMessage && <p className="mb-4 text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name <span className="text-red-500">*</span></label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">Barcode <span className="text-red-500">*</span></label>
                    <input type="text" id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price <span className="text-red-500">*</span></label>
                    <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required step="0.01" min="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="currentStock" className="block text-sm font-medium text-gray-700">Current Stock</label>
                    <input type="number" id="currentStock" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                {/* MODIFIED: Added Total Imported field */}
                <div>
                    <label htmlFor="totalImported" className="block text-sm font-medium text-gray-700">Total Imported</label>
                    <input type="number" id="totalImported" value={totalImported} onChange={(e) => setTotalImported(e.target.value)} min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
                    <input type="number" id="lowStockThreshold" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <LoadingSpinner size="sm" color="text-white mr-2" />
                                Creating Product...
                            </>
                        ) : (
                            'Create Product'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewProductPage;