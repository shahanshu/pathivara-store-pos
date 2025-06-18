// File: app/admin/members/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { FiUsers, FiDollarSign, FiPhone, FiCalendar, FiPlusCircle, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

const AdminMembersPage = () => {
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

    const { user } = useAuth();

    const fetchMembers = useCallback(async () => {
        if (!user) {
            setError("User not authenticated. Please login.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError("");
        setActionMessage({ type: "", text: "" }); // Clear previous messages
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/admin/members', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to fetch members');
            }
            setMembers(data.members);
        } catch (err) {
            console.error(err);
            setError(err.message);
            setMembers([]); // Clear members on error
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    // Placeholder for future actions like delete or edit
    // const handleDeleteMember = async (memberId, memberName) => { ... };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatCurrency = (amount) => {
        return "Rs. " + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'code' })
            .format(amount || 0)
            .replace("USD", "")
            .trim();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20"> {/* Increased py for better centering */}
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading members list...</span>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <FiUsers className="mr-3 text-indigo-600" /> Member Management
                </h1>
                {/* 
                Admin might not add members directly often, this is primarily a cashier function.
                If admin needs to add members, a link to a form page could be added here.
                <Link
                    href="/admin/members/new" // Example path for an admin 'add member' page
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded inline-flex items-center shadow"
                >
                    <FiPlusCircle className="mr-2" /> Add New Member
                </Link> 
                */}
            </div>

            {error && <p className="text-red-600 bg-red-100 p-4 rounded mb-4 shadow">Error: {error}</p>}
            {actionMessage.text && (
                <p className={`p-4 rounded mb-4 shadow ${actionMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {actionMessage.text}
                </p>
            )}

            {!isLoading && !error && members.length === 0 ? (
                <div className="text-center py-10 bg-white shadow-md rounded-lg">
                    <FiUsers className="mx-auto text-6xl text-gray-400 mb-4" />
                    <p className="text-gray-600 text-xl">No members found.</p>
                    <p className="text-gray-500 mt-2">Members will appear here once they are registered via the cashier system.</p>
                </div>
            ) : !error && members.length > 0 ? (
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"><FiPhone className="inline mr-1 mb-px"/>Phone Number</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"><FiDollarSign className="inline mr-1 mb-px"/>Total Purchase</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"><FiCalendar className="inline mr-1 mb-px"/>Joined On</th>
                                {/* Future actions column
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                */}
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((member) => (
                                <tr key={member._id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{member.name}</p>
                                    </td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{member.phoneNumber}</p>
                                    </td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-right">
                                        <p className="text-gray-900 whitespace-no-wrap">{formatCurrency(member.totalPurchaseValue)}</p>
                                    </td>
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{formatDate(member.createdAt)}</p>
                                    </td>
                                    {/* 
                                    <td className="px-5 py-4 border-b border-gray-200 text-sm whitespace-nowrap">
                                        <button title="View Details" className="text-blue-600 hover:text-blue-800 mr-3 p-1 hover:bg-blue-100 rounded-full transition-colors">
                                            <FiEye size={18} />
                                        </button>
                                        <button title="Edit Member" className="text-yellow-500 hover:text-yellow-700 mr-3 p-1 hover:bg-yellow-100 rounded-full transition-colors">
                                            <FiEdit size={18} />
                                        </button>
                                        // Delete action might be risky for admin, consider soft delete or restricted access
                                        // <button 
                                        //     title="Delete Member (Caution!)" 
                                        //     className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded-full transition-colors"
                                        //     onClick={() => handleDeleteMember(member._id, member.name)}
                                        // >
                                        //     <FiTrash2 size={18} />
                                        // </button>
                                    </td> 
                                    */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
};

export default AdminMembersPage;