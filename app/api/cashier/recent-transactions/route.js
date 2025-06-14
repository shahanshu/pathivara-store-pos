// app/api/cashier/recent-transactions/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/utils/withAuth'; // Using the general auth HOC
import { rtdbAdmin } from '@/lib/firebase-admin'; // Import Admin RTDB service

const MAX_RECENT_TRANSACTIONS = 5;

export const GET = withAuth(async function getRecentTransactions(request, { user }) {
  // console.log("API /api/cashier/recent-transactions - User from withAuth:", JSON.stringify(user, null, 2));
  
  if (!user || !user.uid) {
    console.error('API Recent Transactions: User or user.uid is undefined from withAuth.');
    return NextResponse.json({ success: false, message: 'Authentication error: User context not properly established.' }, { status: 401 });
  }
  const cashierId = user.uid;

  try {
    const { db } = await connectToDatabase(); // For MongoDB access
    const salesTransactionCollection = db.collection('salesTransactions');

    // Path to the data in RTDB
    const recentTransactionsRefPath = `recentCashierTransactions/${cashierId}`;
    // console.log("Attempting to read Firebase path with Admin SDK:", recentTransactionsRefPath);

    // Use Admin SDK to get a reference and query the data
    const adminRef = rtdbAdmin.ref(recentTransactionsRefPath);
    const rtdbSnapshot = await adminRef.orderByChild('timestamp').limitToLast(MAX_RECENT_TRANSACTIONS).get();
    
    const recentTransactionSummaries = [];
    if (rtdbSnapshot.exists()) {
      rtdbSnapshot.forEach(childSnapshot => {
        const summaryData = childSnapshot.val();
        if (summaryData && summaryData.mongoTransactionId) {
            recentTransactionSummaries.push({ rtdbKey: childSnapshot.key, ...summaryData });
        } else {
            console.warn("RTDB recent transaction summary (via Admin SDK) missing mongoTransactionId:", childSnapshot.key, summaryData);
        }
      });
      recentTransactionSummaries.reverse(); 
    } else {
      return NextResponse.json({ success: true, transactions: [] }, { status: 200 });
    }

    if (recentTransactionSummaries.length === 0) {
        return NextResponse.json({ success: true, transactions: [] }, { status: 200 });
    }

    const mongoTransactionIds = recentTransactionSummaries.map(summary => summary.mongoTransactionId);
    
    const fullTransactions = await salesTransactionCollection
      .find({ transactionId: { $in: mongoTransactionIds } })
      .toArray();

    const finalSortedTransactions = mongoTransactionIds.map(mtid => 
        fullTransactions.find(ft => ft.transactionId === mtid)
    ).filter(Boolean);

    return NextResponse.json({ success: true, transactions: finalSortedTransactions }, { status: 200 });

  } catch (error) {
    console.error('API Error in getRecentTransactions (using Admin SDK):', error.message);
    // console.error('Full Error:', error);
    return NextResponse.json({ success: false, message: `Failed to fetch recent transactions: ${error.message}` }, { status: 500 });
  }
});