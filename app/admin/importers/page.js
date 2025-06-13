// File: app/admin/importers/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiEdit, FiTrash2, FiPlusCircle } from 'react-icons/fi'; // Example icons

const AdminImportersPage = () => {
  const [importers, setImporters] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(null); // To track which importer is being deleted

  const fetchImporters = async () => {
    if (!user) {
      setIsLoadingList(false);
      setError("User not authenticated.");
      return;
    }
    setIsLoadingList(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/importers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch importers');
      }
      setImporters(data.importers);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchImporters();
  }, [user]);

  const handleDeleteImporter = async (importerId, importerName) => {
    if (!user) {
      setError("User not authenticated.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete importer: "${importerName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(importerId);
    setError('');
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/importers/${importerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete importer');
      }
      // Refresh the list
      setImporters(prevImporters => prevImporters.filter(imp => imp._id !== importerId));
      alert(`Importer "${importerName}" deleted successfully.`);
    } catch (err) {
      console.error(err);
      setError(err.message);
      alert(`Error deleting importer: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Importer Management</h1>
        <Link
          href="/admin/importers/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
        >
          <FiPlusCircle className="mr-2" /> Add New Importer
        </Link>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">Error: {error}</p>}

      {isLoadingList ? (
        <div className="flex justify-center items-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : !error && importers.length === 0 ? (
        <p className="text-gray-600 text-center py-10">No importers found. Start by adding a new one.</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PAN Number</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Info</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {importers.map((importer) => (
                <tr key={importer._id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{importer.name}</p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{importer.panNumber}</p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm">
                    <p className="text-gray-900 whitespace-no-wrap truncate max-w-xs" title={importer.contactInfo}>
                      {importer.contactInfo || '-'}
                    </p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm whitespace-nowrap">
                    <Link
                      href={`/admin/importers/edit/${importer._id}`}
                      className={`text-indigo-600 hover:text-indigo-900 mr-3 ${isDeleting === importer._id ? 'opacity-50 pointer-events-none' : ''}`}
                      title="Edit Importer"
                    >
                      <FiEdit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDeleteImporter(importer._id, importer.name)}
                      className={`text-red-600 hover:text-red-900 ${isDeleting === importer._id ? 'opacity-50 pointer-events-none' : ''}`}
                      disabled={isDeleting === importer._id}
                      title="Delete Importer"
                    >
                      {isDeleting === importer._id ? <LoadingSpinner size="sm" color="text-red-600"/> : <FiTrash2 size={18} />}
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

export default AdminImportersPage;