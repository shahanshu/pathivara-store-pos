'use client';
import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setIsLoadingList(false);
      setError("User not authenticated. Please login."); // Set error
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
  }, [user]); // user is a dependency for fetchProducts

  useEffect(() => {
    if (user) {
      fetchProducts();
    } else {
      setIsLoadingList(false); // Stop loading if no user
      setError("User not authenticated. Please login."); // Also set error
    }
  }, [user, fetchProducts]); // fetchProducts is now a dependency

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
      setError(err.message || 'An error occurred while deleting the product.');
      alert(err.message || 'An error occurred while deleting the product.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Product Management</h1>
        <Link
          href="/admin/products/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          Add New Product
        </Link>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">Error: {error}</p>}

      {isLoadingList && (
        <div className="flex justify-center items-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!isLoadingList && !error && products.length === 0 && (
        <p className="text-gray-600 text-center py-10">No products found. Start by adding a new product.</p>
      )}

      {!isLoadingList && !error && products.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Barcode</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{product.name}</p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{product.barcode}</p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">${product.price.toFixed(2)}</p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{product.currentStock}</p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm whitespace-nowrap">
                    <Link
                      href={`/admin/products/edit/${product._id}`}
                      className={`text-indigo-600 hover:text-indigo-900 mr-3 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteProduct(product._id, product.name)}
                      className={`text-red-600 hover:text-red-900 ${isDeleting === product._id ? 'opacity-50 pointer-events-none' : ""}`}
                      disabled={isDeleting === product._id}
                    >
                      {isDeleting === product._id ? <LoadingSpinner size="sm" color="text-red-600"/> : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;