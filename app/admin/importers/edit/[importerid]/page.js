// File: app/admin/importers/edit/[importerid]/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';


const EditImporterPage = () => {
    const params = useParams();
    const router = useRouter();

    // CRITICAL FIX: The dynamic segment is [importerid] (lowercase).
    // params object will have a key 'importerid'.
    const importerId = params.importerid;

    const [name, setName] = useState("");
    const [panNumber, setPanNumber] = useState("");
    const [contactInfo, setContactInfo] = useState("");

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const { user } = useAuth();

    const fetchImporterData = useCallback(async () => {
        if (!importerId) {
            setError("Importer ID is missing or invalid in URL.");
            setIsLoadingData(false);
            return;
        }
        if (!user) {
            setError("User not authenticated. Please login.");
            setIsLoadingData(false);
            return;
        }

        setIsLoadingData(true);
        setError("");
        setSuccessMessage("");
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/importers/${importerId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to fetch importer data');
            }
            const importer = data.importer;
            if (importer) {
                setName(importer.name);
                setPanNumber(importer.panNumber);
                setContactInfo(importer.contactInfo || "");
            } else {
                throw new Error('Importer data not found in response.');
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoadingData(false);
        }
    }, [importerId, user]);

    useEffect(() => {
        fetchImporterData();
    }, [fetchImporterData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError('User not authenticated. Please login again.');
            return;
        }
        if (!name.trim() || !panNumber.trim()) {
            setError('Importer Name and PAN Number are required.');
            return;
        }

        setIsSubmitting(true);
        setError("");
        setSuccessMessage("");
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/importers/${importerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name, panNumber, contactInfo }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || `Failed to update importer: ${response.status}`);
            }
            setSuccessMessage(data.message || `Importer "${data.importer?.name || name}" updated successfully!`);
            if (data.importer) {
                setName(data.importer.name);
                setPanNumber(data.importer.panNumber);
                setContactInfo(data.importer.contactInfo || "");
            }
            setTimeout(() => setSuccessMessage(""), 5000);
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
                <p className="mt-4 text-gray-600">Loading importer data...</p>
            </div>
        );
    }

    if (error && !name) {
        return (
            <div className="text-center p-8">
                <p className="mb-4 text-red-500 bg-red-100 p-3 rounded-md">{error}</p>
                <Link href="/admin/importers" className="text-indigo-600 hover:text-indigo-800 inline-flex items-center">
                    <FiArrowLeft className="mr-2" /> Back to Importers
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Edit Importer</h1>
                <Link href="/admin/importers" className="text-indigo-600 hover:text-indigo-800 inline-flex items-center">
                    <FiArrowLeft className="mr-2" /> Back to Importers
                </Link>
            </div>

            {error && name && <p className="mb-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            {successMessage && <p className="mb-4 text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Importer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700">
                        PAN Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="panNumber"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">
                        Contact Information (Optional)
                    </label>
                    <textarea
                        id="contactInfo"
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Address, phone, email etc."
                    />
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

export default EditImporterPage;