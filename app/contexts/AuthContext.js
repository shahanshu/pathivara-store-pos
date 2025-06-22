// app/contexts/AuthContext.js
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null); // New state for selected role
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // If user logs out or session expires, clear the role
        setSelectedRole(null);
        localStorage.removeItem('selectedRole');
      }
      setLoading(false);
    });

    // Load selected role from localStorage on initial load
    const storedRole = localStorage.getItem('selectedRole');
    if (storedRole) {
      setSelectedRole(storedRole);
    }

    return () => unsubscribe();
  }, []);

  // Persist selected role to localStorage
  useEffect(() => {
    if (selectedRole) {
      localStorage.setItem('selectedRole', selectedRole);
    } else {
      // Clear if selectedRole becomes null (e.g., on logout before onAuthStateChanged clears it)
      localStorage.removeItem('selectedRole');
    }
  }, [selectedRole]);


  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setSelectedRole(null); // Clear role on logout
      // localStorage.removeItem('selectedRole'); // Already handled by useEffect
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to set the role
  const setRole = (role) => {
    setSelectedRole(role);
  };

  const value = {
    user,
    loading,
    selectedRole, // Expose selectedRole
    setRole,      // Expose setRole function
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};