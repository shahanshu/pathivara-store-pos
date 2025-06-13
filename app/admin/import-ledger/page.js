'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiPlusCircle, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

const AdminImportLedgerPage = () => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) {
        setError("User not authenticated. Please login.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError("");
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/import-ledger', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch import ledger entries');
        }
        setEntries(data.entries);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
        fetchEntries();
    } else {
        setIsLoading(false); 
    }
  }, [user]); 

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] py-10">
        <LoadingSpinner size="lg" />
        <p className="ml-2 text-gray-600">Loading import ledger...</p>
      </div>
    );
  }

  if (!user && !isLoading) {
    return (
        <div className="text-center py-10">
            <p className="text-red-500 bg-red-100 p-3 rounded mb-4">Error: User not authenticated. Please login.</p>
            <Link href="/login" className="text-indigo-600 hover:text-indigo-800">Go to Login</Link>
        </div>
    );
  }


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Import Ledger</h1>
        <Link
          href="/admin/import-ledger/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded inline-flex items-center shadow hover:shadow-lg transition-shadow duration-200"
        >
          <FiPlusCircle className="mr-2" /> Record New Import
        </Link>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">Error: {error}</p>}

      {!error && entries.length === 0 && !isLoading && (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
            <FiArchive className="mx-auto text-6xl text-gray-400 mb-4" />
            <p className="text-gray-600 text-xl">No import ledger entries found.</p>
            <p className="text-gray-500 mt-2">Start by recording a new import using the button above.</p>
        </div>
      )}

      {!error && entries.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-100">{/* Ensure no whitespace before first th or after last th if on same line */}
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Import Date</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Importer</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice #</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Items Count</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Cost</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry._id} className="hover:bg-gray-50 transition-colors duration-150">{/* NO WHITESPACE START */}
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">
                    {new Date(entry.importDate).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">
                    <Link href={`/admin/importers/edit/${entry.importerInfo?._id}`} className="text-indigo-600 hover:underline" title={`View/Edit Importer: ${entry.importerInfo?.name}`}>
                        {entry.importerInfo?.name || 'N/A'}
                    </Link>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">
                    {entry.invoiceNumber || '-'}
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm text-right">
                    {entry.itemCount}
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm text-right">
                    ${entry.grandTotalCost ? entry.grandTotalCost.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm text-center whitespace-nowrap">
                    <Link 
                        href={`/admin/import-ledger/${entry._id}`} 
                        className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100 transition-colors duration-150 inline-block" // Added inline-block
                        title="View Details"
                    >
                        <FiEye size={18} />
                    </Link>
                    {/* Placeholder for future Edit/Delete actions */}
                    {/* 
                    <button 
                        className="text-yellow-500 hover:text-yellow-700 ml-3 p-1 rounded-full hover:bg-yellow-100 transition-colors duration-150 inline-block disabled:opacity-50 disabled:cursor-not-allowed" 
                        title="Edit Import (Coming Soon)" 
                        disabled
                    >
                        <FiEdit size={18} />
                    </button>
                    <button 
                        className="text-red-500 hover:text-red-700 ml-3 p-1 rounded-full hover:bg-red-100 transition-colors duration-150 inline-block disabled:opacity-50 disabled:cursor-not-allowed" 
                        title="Delete Import (Coming Soon)" 
                        disabled
                    >
                        <FiTrash2 size={18} />
                    </button> 
                    */}
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

export default AdminImportLedgerPage;