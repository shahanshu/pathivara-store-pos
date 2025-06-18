// File: app/admin/products/page.js
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiSearch, FiEdit, FiTrash2, FiPlusCircle, FiTag, FiPackage, FiInbox } from 'react-icons/fi';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null); // productId being deleted
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // For search functionality
  const { user } = useAuth();

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setIsLoadingList(false);
      setError("User not authenticated. Please login.");
      return;
    }
    setIsLoadingList(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/products', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch products: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      } else {
        throw new Error(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoadingList(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    } else {
      setIsLoadingList(false);
      setError("User not authenticated. Please login.");
    }
  }, [user, fetchProducts]);

  const handleDeleteProduct = async (productId, productName) => {
    if (!user) {
      setError("User not authenticated.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete product: "${productName}"? This action cannot be undone.`)) {
      return;
    }
    setIsDeleting(productId);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete product');
      }
      setProducts(prevProducts => prevProducts.filter(p => p._id !== productId));
    } catch (err) {
      console.error(err);
      setError(err.message);
      alert(err.message || 'An error occurred while deleting the product.');
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR', // Or your local currency
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Product Management</h1>
        <Link
          href="/admin/products/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
        >
          <FiPlusCircle className="mr-2" /> Add New Product
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, barcode, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">Error: {error}</p>}

      {isLoadingList && (
        <div className="flex justify-center items-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!isLoadingList && !error && filteredProducts.length === 0 && (
        <p className="text-gray-600 text-center py-10">
          {searchTerm ? "No products match your search." : "No products found. Start by adding a new product."}
        </p>
      )}

      {!isLoadingList && !error && filteredProducts.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Barcode</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {/* MODIFIED: Renamed header for clarity */}
                  <FiInbox className="inline mr-1 mb-px" /> Current Stock
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <FiPackage className="inline mr-1 mb-px" /> Total Imported
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <FiTag className="inline mr-1 mb-px" /> Category
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                // MODIFIED: Added more granular stock highlighting logic
                const stockClass =
                  product.currentStock === 0
                    ? 'text-red-600 font-semibold' // Out of stock is red
                    : product.currentStock <= (product.lowStockThreshold ?? 10)
                    ? 'text-yellow-600 font-semibold' // Low stock is yellow
                    : 'text-gray-900'; // Normal stock

                return (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">{product.name}</p>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">{product.barcode}</p>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">{formatCurrency(product.price)}</p>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                      <p className={`whitespace-no-wrap ${stockClass}`}>
                        {product.currentStock}
                      </p>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">{product.totalImportedEver || 0}</p>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">{product.category || 'N/A'}</p>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm whitespace-nowrap">
                      <Link
                        href={`/admin/products/edit/${product._id}`}
                        className={`text-indigo-600 hover:text-indigo-900 mr-3 inline-block ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                        title="Edit Product"
                      >
                        <FiEdit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(product._id, product.name)}
                        className={`text-red-600 hover:text-red-900 inline-block ${isDeleting === product._id ? 'opacity-50 pointer-events-none' : ''}`}
                        disabled={isDeleting === product._id}
                        title="Delete Product"
                      >
                        {isDeleting === product._id ? <LoadingSpinner size="sm" color="text-red-600" /> : <FiTrash2 size={18} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;