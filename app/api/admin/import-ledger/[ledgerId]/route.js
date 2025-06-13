import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAdminAuth } from '@/utils/apiAuth';

// The second argument to the handler is the context object, which contains params
export const GET = withAdminAuth(async function GET(request, context) { 
  let ledgerIdForLogging = "unknown"; // For logging in case of early errors

  try {
    // Defensive check for context and context.params
    if (!context || !context.params) {
        console.error("API Error: Context or context.params is undefined in GET /api/admin/import-ledger/[ledgerId]. Context:", context);
        return NextResponse.json({ success: false, message: 'Server error: Invalid request context.' }, { status: 500 });
    }

    // Resolve params, handling if it's a promise (less common for route handlers but robust)
    const routeParams = context.params instanceof Promise ? await context.params : context.params;

    if (!routeParams) {
        console.error("API Error: Route parameters (routeParams) resolved to undefined/null. Original context.params:", context.params);
        return NextResponse.json({ success: false, message: 'Server error: Could not resolve route parameters.' }, { status: 500 });
    }

    const { ledgerId } = routeParams; 
    ledgerIdForLogging = ledgerId || "undefined in routeParams"; // Update for more specific logging

    console.log(`API: GET /api/admin/import-ledger/[ledgerId] - Attempting to process ledgerId: '${ledgerId}'`);

    if (!ledgerId || !ObjectId.isValid(ledgerId)) {
      console.error(`API Error: Invalid or missing Ledger ID. Received: '${ledgerId}'`);
      return NextResponse.json({ success: false, message: 'Valid Ledger ID is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Using a more robust aggregation pipeline that was previously defined
    const entryArray = await db.collection('importLedgerEntries').aggregate([
      { $match: { _id: new ObjectId(ledgerId) } },
      {
        $lookup: { 
          from: 'importers',
          localField: 'importerId',
          foreignField: '_id',
          as: 'importerInfo'
        }
      },
      {
        $unwind: {
          path: '$importerInfo',
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $unwind: '$items' // Deconstruct items array to process each item
      },
      {
        $lookup: { 
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'items.productDetails' // Product details will be nested under items
        }
      },
      {
        $unwind: {
          path: '$items.productDetails',
          preserveNullAndEmptyArrays: true // Keep item even if related product is gone
        }
      },
      { // Group back the items into an array for the single ledger entry
        $group: {
          _id: '$_id', // Group by the original ledger entry ID
          importerId: { $first: '$importerId' },
          importDate: { $first: '$importDate' },
          invoiceNumber: { $first: '$invoiceNumber' },
          grandTotalCost: { $first: '$grandTotalCost' },
          createdAt: { $first: '$createdAt' },
          userId: { $first: '$userId' }, // Assuming you have this field
          importerInfo: { $first: '$importerInfo' }, // Get the populated importer info
          items: { $push: '$items' } // Push processed items (now with productDetails) back
        }
      }
    ]).toArray();


    if (!entryArray || entryArray.length === 0) {
      console.warn(`API Warn: Import ledger entry not found for ID: ${ledgerId}`);
      return NextResponse.json({ success: false, message: 'Import ledger entry not found.' }, { status: 404 });
    }

    // The aggregation, even for a single $match, returns an array. We expect one document.
    console.log(`API: Successfully fetched import ledger entry for ID: ${ledgerId}`);
    return NextResponse.json({ success: true, entry: entryArray[0] }, { status: 200 });

  } catch (error) {
    console.error(`API Error: Failed to fetch import ledger entry for ledgerId '${ledgerIdForLogging}':`, error);
    return NextResponse.json({ success: false, message: 'Failed to fetch import ledger entry due to a server error.', error: error.message }, { status: 500 });
  }
});