// File: app/admin/products/edit/[productId]/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation'; 
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiArrowLeft } from 'react-icons/fi';

const EditProductPage = () => {
 const params = useParams();
 const { productId } = params;
 const { user } = useAuth();

 const [name, setName] = useState("");
 const [barcode, setBarcode] = useState(""); // Barcode is read-only on edit
 const [price, setPrice] = useState("");
 const [description, setDescription] = useState("");
 const [currentStock, setCurrentStock] = useState(0);
 // MODIFIED: Removed category state
 const [lowStockThreshold, setLowStockThreshold] = useState(10);
 
 const [isLoadingData, setIsLoadingData] = useState(true);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState("");
 const [successMessage, setSuccessMessage] = useState("");

 const fetchProductData = useCallback(async () => {
  if (!productId || !user) {
   setIsLoadingData(false);
   if (!user) setError("User not authenticated.");
   if (!productId) setError("Product ID is missing.");
   return;
  }
  setIsLoadingData(true);
  setError("");
  try {
   const token = await user.getIdToken();
   const response = await fetch(`/api/admin/products/${productId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
   });
   const data = await response.json();
   if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch product data');
   }
   const product = data.product;
   setName(product.name);
   setBarcode(product.barcode); // Set barcode for display
   setPrice(product.price.toString());
   setDescription(product.description || "");
   setCurrentStock(product.currentStock || 0);
   // MODIFIED: Removed setCategory
   setLowStockThreshold(product.lowStockThreshold ?? 10); // Use ?? for default
  } catch (err) {
   console.error(err);
   setError(err.message);
  } finally {
   setIsLoadingData(false);
  }
 }, [productId, user]);

 useEffect(() => {
  fetchProductData();
 }, [fetchProductData]);

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!user) {
   setError("User not authenticated.");
   return;
  }
  setIsSubmitting(true);
  setError("");
  setSuccessMessage("");

  if (!name || !price) {
   setError('Name and Price are required.');
   setIsSubmitting(false);
   return;
  }
  if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
   setError('Price must be a positive number.');
   setIsSubmitting(false);
   return;
  }
  if (isNaN(parseInt(currentStock)) || parseInt(currentStock) < 0) {
   setError('Current stock must be a non-negative number.');
   setIsSubmitting(false);
   return;
  }
  if (isNaN(parseInt(lowStockThreshold)) || parseInt(lowStockThreshold) < 0) {
   setError('Low stock threshold must be a non-negative number.');
   setIsSubmitting(false);
   return;
  }

  // MODIFIED: Barcode is not sent for update. category is removed.
  const productDataToUpdate = {
   name, price: parseFloat(price), description,
   currentStock: parseInt(currentStock),
   lowStockThreshold: parseInt(lowStockThreshold),
  };

  try {
   const token = await user.getIdToken();
   const response = await fetch(`/api/admin/products/${productId}`, {
    method: 'PUT',
    headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(productDataToUpdate),
   });
   const data = await response.json();
   if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to update product');
   }
   setSuccessMessage(data.message || 'Product updated successfully!');
   
   // Re-set form fields from response if backend modifies/validates further
   if(data.product) {
    const product = data.product;
    setName(product.name);
    setPrice(product.price.toString());
    setDescription(product.description || "");
    setCurrentStock(product.currentStock || 0);
    // MODIFIED: Removed setCategory
    setLowStockThreshold(product.lowStockThreshold ?? 10);
   }
  } catch (err) {
   console.error(err);
   setError(err.message);
  } finally {
   setIsSubmitting(false);
  }
 };
 
 if (isLoadingData) {
  return (
   <div className="flex flex-col justify-center items-center min-h-[calc(100vh-theme(space.16)-theme(space.16))]">
    <LoadingSpinner size="lg" />
    <p className="mt-4 text-gray-600">Loading product data...</p>
   </div>
  );
 }
 
 if (!isLoadingData && error && !name) { // If initial load failed critically
  return (
   <div className="text-center p-8">
    <p className="mb-4 text-red-500 bg-red-100 p-3 rounded-md">{error}</p>
    <Link href="/admin/products" className="text-indigo-600 hover:text-indigo-800 inline-flex items-center">
     <FiArrowLeft className="mr-1" /> Back to Products
    </Link>
   </div>
  );
 }

 return (
  <div>
   <div className="flex justify-between items-center mb-6">
    <h1 className="text-3xl font-bold text-gray-800">Edit Product</h1>
    <Link href="/admin/products" className="text-indigo-600 hover:text-indigo-800 inline-flex items-center">
     <FiArrowLeft className="mr-1" /> Back to Products
    </Link>
   </div>

   {error && <p className="mb-4 text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
   {successMessage && <p className="mb-4 text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}
   
   <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
    <div>
     <label htmlFor="barcode-display" className="block text-sm font-medium text-gray-700">Barcode (Read-only)</label>
     <input type="text" id="barcode-display" value={barcode} readOnly 
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm"/>
    </div>
    <div>
     <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name <span className="text-red-500">*</span></label>
     <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
    </div>
    <div>
     <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price <span className="text-red-500">*</span></label>
     <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required
      step="0.01" min="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
    </div>
    <div>
     <label htmlFor="currentStock" className="block text-sm font-medium text-gray-700">Current Stock</label>
     <input type="number" id="currentStock" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
    </div>
    {/* MODIFIED: Removed category field from form */}
    <div>
     <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
     <input type="number" id="lowStockThreshold" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
    </div>
    <div>
     <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
     <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
    </div>
    <div>
     <button 
      type="submit" 
      disabled={isSubmitting || isLoadingData} 
      className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
     >
      {isSubmitting ? (
       <>
        <LoadingSpinner size="sm" color="text-white mr-2" />
        Saving Changes...
       </>
      ) : (
       'Save Changes'
      )}
     </button>
    </div>
   </form>
  </div>
 );
};

export default EditProductPage;