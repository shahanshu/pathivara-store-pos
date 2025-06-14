// lib/firebaseSync.js
// REMOVE: import { rtdb, ref, set, update, remove, push, serverTimestamp } from './firebase';
import { rtdbAdmin } from './firebase-admin'; // USE THE ADMIN DATABASE INSTANCE
// The Admin SDK's 'ref', 'set', 'update', 'remove', 'push', 'serverTimestamp' are methods on rtdbAdmin or its refs.
// For serverTimestamp, it's admin.database.ServerValue.TIMESTAMP

import admin from './firebase-admin'; // To get admin.database.ServerValue

/**
 * Syncs product data to Firebase Realtime Database under /productsInfo/{barcode}
 * @param {object} product - The product object from MongoDB
 */
export const syncProductToRTDB = async (product) => {
  if (!product || !product.barcode) {
    console.error("Firebase RTDB Sync (Admin): Product or barcode is missing for full sync.", product);
    return;
  }
  const productDataForRTDB = {
    name: product.name,
    price: product.price,
    currentStock: product.currentStock,
  };
  try {
    const productRef = rtdbAdmin.ref(`productsInfo/${product.barcode}`); // Use rtdbAdmin.ref
    await productRef.set(productDataForRTDB); // Use ref.set()
    console.log(`Firebase RTDB Sync (Admin): Successfully synced product ${product.barcode}`);
  } catch (error) {
    console.error(`Firebase RTDB Sync (Admin): Error syncing product ${product.barcode}:`, error);
  }
};

/**
 * Updates specific fields for a product in Firebase Realtime Database.
 * @param {string} barcode - The product barcode.
 * @param {object} updates - An object containing fields to update (e.g., { currentStock: 10 }).
 */
export const updateProductInRTDB = async (barcode, updates) => {
  if (!barcode || !updates || Object.keys(updates).length === 0) {
    console.error("Firebase RTDB Update (Admin): Barcode or updates are missing/empty.");
    return;
  }
  try {
    const productRef = rtdbAdmin.ref(`productsInfo/${barcode}`); // Use rtdbAdmin.ref
    await productRef.update(updates); // Use ref.update()
    console.log(`Firebase RTDB Update (Admin): Successfully updated product ${barcode} with`, updates);
  } catch (error) {
    console.error(`Firebase RTDB Update (Admin): Error updating product ${barcode}:`, error);
    // Re-throw if you want the caller (API route) to handle it
    // throw error; 
  }
};

/**
 * Removes a product from Firebase Realtime Database.
 * @param {string} barcode - The product barcode.
 */
export const removeProductFromRTDB = async (barcode) => {
  if (!barcode) {
    console.error("Firebase RTDB Remove (Admin): Barcode is missing.");
    return;
  }
  try {
    const productRef = rtdbAdmin.ref(`productsInfo/${barcode}`); // Use rtdbAdmin.ref
    await productRef.remove(); // Use ref.remove()
    console.log(`Firebase RTDB Remove (Admin): Successfully removed product ${barcode}`);
  } catch (error) {
    console.error(`Firebase RTDB Remove (Admin): Error removing product ${barcode}:`, error);
  }
};

/**
 * Adds a lightweight record of a transaction to /recentCashierTransactions/{cashierId}
 * @param {string} cashierId - The UID of the cashier.
 * @param {object} transactionSummary - Summary data of the transaction.
 */
export const addRecentCashierTransaction = async (cashierId, transactionSummary) => {
  if (!cashierId || !transactionSummary || !transactionSummary.mongoTransactionId) {
    console.error("Firebase RTDB Sync (Admin): Cashier ID or essential transaction data is missing for recent transaction.", { cashierId, transactionSummary });
    return; 
  }
  try {
    const recentTransactionsRef = rtdbAdmin.ref(`recentCashierTransactions/${cashierId}`); // Use rtdbAdmin.ref
    const newTransactionNode = recentTransactionsRef.push(); // Use ref.push()
    await newTransactionNode.set({ // Use pushed_ref.set()
      ...transactionSummary,
      timestamp: admin.database.ServerValue.TIMESTAMP // Use Admin SDK's ServerValue
    });
    console.log(`Firebase RTDB Sync (Admin): Successfully added recent transaction for cashier ${cashierId}`);
  } catch (error) {
    console.error(`Firebase RTDB Sync (Admin): Error adding recent transaction for cashier ${cashierId}:`, error);
    // Re-throw if you want the caller (API route) to handle it
    // throw error;
  }
};