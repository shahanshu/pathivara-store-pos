// lib/firebaseSync.js
import { rtdb, ref, set, update, remove, push, serverTimestamp } from './firebase'; // Import necessary functions

/**
 * Syncs product data to Firebase Realtime Database under /productsInfo/{barcode}
 * @param {object} product - The product object from MongoDB
 * Must contain at least barcode, name, price, currentStock.
 */
export const syncProductToRTDB = async (product) => {
  if (!product || !product.barcode) {
    console.error("Firebase RTDB Sync: Product or barcode is missing for full sync.", product);
    return;
  }
  const productDataForRTDB = {
    name: product.name,
    price: product.price,
    currentStock: product.currentStock,
    // Add any other fields you deem necessary for quick cashier lookup
  };
  try {
    const productRef = ref(rtdb, `productsInfo/${product.barcode}`);
    await set(productRef, productDataForRTDB);
    console.log(`Firebase RTDB Sync: Successfully synced product ${product.barcode}`);
  } catch (error) {
    console.error(`Firebase RTDB Sync: Error syncing product ${product.barcode}:`, error);
    // Depending on your error handling strategy, you might want to throw the error
  }
};

/**
 * Updates specific fields for a product in Firebase Realtime Database.
 * @param {string} barcode - The product barcode.
 * @param {object} updates - An object containing fields to update (e.g., { currentStock: 10 }).
 */
export const updateProductInRTDB = async (barcode, updates) => {
  if (!barcode || !updates || Object.keys(updates).length === 0) {
    console.error("Firebase RTDB Update: Barcode or updates are missing/empty.");
    return;
  }
  try {
    const productRef = ref(rtdb, `productsInfo/${barcode}`);
    await update(productRef, updates);
    console.log(`Firebase RTDB Update: Successfully updated product ${barcode} with`, updates);
  } catch (error) {
    console.error(`Firebase RTDB Update: Error updating product ${barcode}:`, error);
  }
};

/**
 * Removes a product from Firebase Realtime Database.
 * @param {string} barcode - The product barcode.
 */
export const removeProductFromRTDB = async (barcode) => {
  if (!barcode) {
    console.error("Firebase RTDB Remove: Barcode is missing.");
    return;
  }
  try {
    const productRef = ref(rtdb, `productsInfo/${barcode}`);
    await remove(productRef);
    console.log(`Firebase RTDB Remove: Successfully removed product ${barcode}`);
  } catch (error) {
    console.error(`Firebase RTDB Remove: Error removing product ${barcode}:`, error);
  }
};

/**
 * Adds a lightweight record of a transaction to /recentCashierTransactions/{cashierId}
 * @param {string} cashierId - The UID of the cashier.
 * @param {object} transactionSummary - Summary data of the transaction.
 *                                      Example: { mongoTransactionId, grandTotal, itemCount, status }
 */
export const addRecentCashierTransaction = async (cashierId, transactionSummary) => {
  if (!cashierId || !transactionSummary || !transactionSummary.mongoTransactionId) {
    console.error("Firebase RTDB Sync: Cashier ID or essential transaction data is missing for recent transaction.", { cashierId, transactionSummary });
    return; // Or throw error
  }
  try {
    // Using push() generates a unique key for each new transaction
    const recentTransactionsRef = ref(rtdb, `recentCashierTransactions/${cashierId}`);
    const newTransactionRef = push(recentTransactionsRef); 
    await set(newTransactionRef, {
      ...transactionSummary,
      timestamp: serverTimestamp() // Firebase server-side timestamp
    });
    console.log(`Firebase RTDB Sync: Successfully added recent transaction for cashier ${cashierId}`);
  } catch (error) {
    console.error(`Firebase RTDB Sync: Error adding recent transaction for cashier ${cashierId}:`, error);
    // Depending on your error handling strategy, you might want to throw the error
  }
};