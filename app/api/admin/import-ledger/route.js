import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAdminAuth } from '@/utils/apiAuth';
import { syncProductToRTDB, updateProductInRTDB } from '@/lib/firebaseSync';

export const POST = withAdminAuth(async function POST(request, { user }) {
  console.log("API: Received POST request to /api/admin/import-ledger"); // Log request start
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    console.log("API: Request body:", JSON.stringify(body, null, 2)); // Log entire body

    const { importerId, importDate, invoiceNumber, items } = body;

    if (!importerId || !importDate || !items || items.length === 0) {
      console.error("API: Validation failed - Missing importer, import date, or items.");
      return NextResponse.json({ success: false, message: 'Importer, import date, and at least one item are required.' }, { status: 400 });
    }

    if (!ObjectId.isValid(importerId)) {
        console.error("API: Validation failed - Invalid Importer ID format:", importerId);
        return NextResponse.json({ success: false, message: 'Invalid Importer ID format.' }, { status: 400 });
    }
    
    const importerExists = await db.collection('importers').findOne({ _id: new ObjectId(importerId) });
    if (!importerExists) {
        console.error("API: Validation failed - Selected importer does not exist:", importerId);
        return NextResponse.json({ success: false, message: 'Selected importer does not exist.' }, { status: 404 });
    }

    let grandTotalCost = 0;
    const processedItems = [];

    for (const item of items) {
      console.log(`API: Processing item with barcode: ${item.barcode}`); // Log each item start
      if (!item.barcode || !item.productName || item.quantityImported == null || item.ratePerItem == null) {
        console.error(`API: Validation failed - Missing data for item with barcode ${item.barcode || 'N/A'}.`);
        return NextResponse.json({ success: false, message: `Missing data for item with barcode ${item.barcode || 'N/A'}. All items require barcode, name, quantity, and rate.` }, { status: 400 });
      }
      if (isNaN(parseFloat(item.quantityImported)) || parseFloat(item.quantityImported) <= 0) {
        console.error(`API: Validation failed - Quantity for item ${item.productName} is not positive. Value: ${item.quantityImported}`);
        return NextResponse.json({ success: false, message: `Quantity for item ${item.productName} must be a positive number.` }, { status: 400 });
      }
      if (isNaN(parseFloat(item.ratePerItem)) || parseFloat(item.ratePerItem) < 0) { // Rate can be 0 if it's a free sample
        console.error(`API: Validation failed - Rate for item ${item.productName} is negative. Value: ${item.ratePerItem}`);
        return NextResponse.json({ success: false, message: `Rate for item ${item.productName} must be a non-negative number.` }, { status: 400 });
      }

      let productId;
      let existingProduct = await db.collection('products').findOne({ barcode: item.barcode });

      if (item.isNewProduct || !existingProduct) {
        console.log(`API: Item '${item.productName}' (Barcode: ${item.barcode}) is new or not found. isNewProduct flag: ${item.isNewProduct}`);
        // Create new product
        if (!item.newProductDetails || item.newProductDetails.price == null || String(item.newProductDetails.price).trim() === "") { // Added trim check for empty string
          console.error(`API: Validation failed - Selling price is missing or null for new product ${item.productName}. Details:`, item.newProductDetails);
          return NextResponse.json({ success: false, message: `Selling price is required for new product ${item.productName}.` }, { status: 400 });
        }
        
        // --- THIS IS THE CRITICAL LOGGING SECTION for the error you're seeing ---
        const priceString = String(item.newProductDetails.price); // Ensure it's a string before logging/parsing
        console.log(`API: Validating new product '${item.productName}', price received: '${priceString}', type: ${typeof priceString}`);
        const parsedPrice = parseFloat(priceString);
        console.log(`API: Parsed price for '${item.productName}': ${parsedPrice}`);
        // --- End of critical logging ---

        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            console.error(`API: PRICE VALIDATION FAILED for ${item.productName}. Input price string: '${priceString}', Parsed float: ${parsedPrice}`);
            return NextResponse.json({ success: false, message: `Selling price for new product ${item.productName} must be a positive number.` }, { status: 400 });
        }
        // --- End of specific price validation ---

        if (existingProduct && existingProduct.barcode === item.barcode) {
             console.warn(`API: Edge case - Product with barcode ${item.barcode} was marked as new but already exists. Aborting.`);
             return NextResponse.json({ success: false, message: `Product with barcode ${item.barcode} was marked as new but already exists. Please re-verify.` }, { status: 409 });
        }

        const newProductData = {
          barcode: item.barcode,
          name: item.productName,
          price: parsedPrice, // Use the already parsed and validated price
          currentStock: parseInt(item.quantityImported, 10),
          totalImportedEver: parseInt(item.quantityImported, 10),
          totalSoldEver: 0,
          lowStockThreshold: parseInt(item.newProductDetails.lowStockThreshold, 10) || 10,
          category: item.newProductDetails.category || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        console.log(`API: Creating new product data for ${item.productName}:`, JSON.stringify(newProductData, null, 2));
        const insertResult = await db.collection('products').insertOne(newProductData);
        productId = insertResult.insertedId;
        console.log(`API: New product ${item.productName} created with ID: ${productId}. Syncing to RTDB.`);
        await syncProductToRTDB({ _id: productId, ...newProductData });
      } else {
        console.log(`API: Item '${item.productName}' (Barcode: ${item.barcode}) is an existing product. Updating stock.`);
        // Update existing product
        productId = existingProduct._id;
        const newStock = (existingProduct.currentStock || 0) + parseInt(item.quantityImported, 10);
        const newTotalImported = (existingProduct.totalImportedEver || 0) + parseInt(item.quantityImported, 10);
        
        console.log(`API: Updating stock for ${existingProduct.name}. Old stock: ${existingProduct.currentStock}, New stock: ${newStock}. Old total imported: ${existingProduct.totalImportedEver}, New total imported: ${newTotalImported}`);
        await db.collection('products').updateOne(
          { _id: productId },
          { 
            $set: { 
              currentStock: newStock,
              totalImportedEver: newTotalImported,
              updatedAt: new Date(),
            }
          }
        );
        console.log(`API: Stock updated for ${existingProduct.name}. Syncing to RTDB.`);
        await updateProductInRTDB(existingProduct.barcode, { currentStock: newStock });
      }

      const totalCostForItem = parseFloat(item.quantityImported) * parseFloat(item.ratePerItem);
      grandTotalCost += totalCostForItem;
      processedItems.push({
        productId: new ObjectId(productId),
        barcode: item.barcode,
        productName: item.productName,
        quantityImported: parseInt(item.quantityImported, 10),
        ratePerItem: parseFloat(item.ratePerItem),
        totalCostForItem: totalCostForItem,
      });
      console.log(`API: Item ${item.productName} processed successfully.`);
    }

    const newLedgerEntry = {
      importerId: new ObjectId(importerId),
      importDate: new Date(importDate),
      invoiceNumber: invoiceNumber || null,
      items: processedItems,
      grandTotalCost: grandTotalCost,
      createdAt: new Date(),
      userId: user.uid, 
    };
    console.log("API: Creating new ledger entry:", JSON.stringify(newLedgerEntry, null, 2));
    const result = await db.collection('importLedgerEntries').insertOne(newLedgerEntry);
    const createdEntry = await db.collection('importLedgerEntries').findOne({_id: result.insertedId});
    console.log("API: Import ledger entry created successfully with ID:", result.insertedId);

    return NextResponse.json({ success: true, message: 'Import ledger entry created successfully.', entry: createdEntry }, { status: 201 });

  } catch (error) {
    console.error("API: CRITICAL ERROR in POST /api/admin/import-ledger:", error); // Log any unexpected errors
    if (error.code === 11000) {
        console.error("API: MongoDB duplicate key error:", error.message);
        return NextResponse.json({ success: false, message: 'Duplicate key error, possibly related to product creation if barcodes conflict.', error: error.message }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Failed to create import ledger entry.', error: error.message }, { status: 500 });
  }
});

export const GET = withAdminAuth(async function GET(request, { user }) {
  // console.log("API: Received GET request to /api/admin/import-ledger"); // Log GET request start
  try {
    const { db } = await connectToDatabase();
    
    const entries = await db.collection('importLedgerEntries')
        .aggregate([
            { $sort: { importDate: -1, createdAt: -1 } },
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
                $project: { 
                    _id: 1,
                    importDate: 1,
                    invoiceNumber: 1,
                    grandTotalCost: 1,
                    createdAt: 1,
                    itemCount: { $size: "$items" },
                    'importerInfo.name': 1,
                    'importerInfo._id': 1
                }
            }
        ])
        .toArray();
    // console.log(`API: Fetched ${entries.length} import ledger entries.`);
    return NextResponse.json({ success: true, entries }, { status: 200 });
  } catch (error) {
    console.error("API: CRITICAL ERROR in GET /api/admin/import-ledger:", error);
    return NextResponse.json({ success: false, message: 'Failed to fetch import ledger entries', error: error.message }, { status: 500 });
  }
});