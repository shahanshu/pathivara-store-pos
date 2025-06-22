'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiArrowLeft, FiUser, FiCalendar, FiFileText, FiArchive, FiDollarSign, FiTag, FiBarChart2, FiShoppingCart } from 'react-icons/fi';

const ImportLedgerDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { ledgerId } = params;
  const { user } = useAuth();

  const [entry, setEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ledgerId || !user) {
      if (!user) setError("User not authenticated.");
      else setError("Ledger ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchEntryDetails = async () => {
      setIsLoading(true);
      setError('');
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/admin/import-ledger/${ledgerId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch import ledger entry details');
        }
        setEntry(data.entry);
      } catch (err) {
        console.error(err);
        setError(err.message);
        if (err.message.toLowerCase().includes('not found')) {
            // Optionally redirect or show specific not found UI
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntryDetails();
  }, [ledgerId, user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <LoadingSpinner size="lg" />
        <p className="ml-2">Loading entry details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 bg-red-100 p-4 rounded-md">Error: {error}</p>
        <Link href="/admin/import-ledger" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800">
          <FiArrowLeft className="mr-2" /> Back to Import Ledger List
        </Link>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">Import ledger entry not found.</p>
        <Link href="/admin/import-ledger" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800">
          <FiArrowLeft className="mr-2" /> Back to Import Ledger List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <Link href="/admin/import-ledger" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-2">
          <FiArrowLeft className="mr-2" /> Back to Import Ledger List
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Import Ledger Details</h1>
      </div>

      <div className="bg-white shadow-xl rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <FiUser className="text-indigo-500 mr-2" /> 
            <strong>Importer:</strong> <span className="ml-1">{entry.importerInfo?.name || 'N/A'} ({entry.importerInfo?.panNumber || 'N/A'})</span>
          </div>
          <div className="flex items-center">
            <FiCalendar className="text-indigo-500 mr-2" /> 
            <strong>Import Date:</strong> <span className="ml-1">{new Date(entry.importDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <FiFileText className="text-indigo-500 mr-2" /> 
            <strong>Invoice #:</strong> <span className="ml-1">{entry.invoiceNumber || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <FiDollarSign className="text-indigo-500 mr-2" /> 
            <strong>Total Cost:</strong> <span className="ml-1">Rs. {entry.grandTotalCost.toFixed(2)}</span>
          </div>
          <div className="flex items-center col-span-1 md:col-span-2">
            <FiCalendar className="text-gray-500 mr-2" /> 
            <strong>Recorded On:</strong> <span className="ml-1 text-gray-600">{new Date(entry.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Imported Items ({entry.items?.length || 0})</h2>
        {entry.items && entry.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                  <th className="px-3 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name</th>
                  <th className="px-3 py-2 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Barcode</th>
                  <th className="px-3 py-2 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty Imp.</th>
                  <th className="px-3 py-2 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate/Item</th>
                  <th className="px-3 py-2 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {entry.items.map((item, index) => (
                  <tr key={item.productId + '-' + index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border-b border-gray-200">{index + 1}</td>
                    <td className="px-3 py-2 border-b border-gray-200">
                      {item.productDetails?.name || item.productName || 'N/A'}
               
                    </td>
                    <td className="px-3 py-2 border-b border-gray-200">{item.productDetails?.barcode || item.barcode || 'N/A'}</td>
                    <td className="px-3 py-2 border-b border-gray-200 text-right">{item.quantityImported}</td>
                    <td className="px-3 py-2 border-b border-gray-200 text-right">Rs. {parseFloat(item.ratePerItem || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 border-b border-gray-200 text-right">Rs. {parseFloat(item.totalCostForItem || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No items found in this import entry.</p>
        )}
      </div>
    </div>
  );
};

export default ImportLedgerDetailPage;