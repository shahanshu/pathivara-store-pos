// File: app/api/admin/import-ledger/route.js

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAdminAuth } from '@/utils/apiAuth';
import { syncProductToRTDB, updateProductInRTDB } from '@/lib/firebaseSync';

// POST a new import ledger entry
export const POST = withAdminAuth(async function POST(request, { user }) {
  console.log("API: Received POST request to /api/admin/import-ledger");
  const { db } = await connectToDatabase();
  let session; // Transactions are not used in this version, but the variable is kept for potential future use

  try {
    const body = await request.json();
    const { importerId, importDate, invoiceNumber, items } = body;

    // --- Server-side Validation ---
    if (!importerId || !importDate || !items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Importer, import date, and at least one item are required.' }, { status: 400 });
    }
    if (!ObjectId.isValid(importerId)) {
      return NextResponse.json({ success: false, message: 'Invalid Importer ID format.' }, { status: 400 });
    }
    const importerExists = await db.collection('importers').findOne({ _id: new ObjectId(importerId) });
    if (!importerExists) {
      return NextResponse.json({ success: false, message: 'Selected importer does not exist.' }, { status: 404 });
    }

    let grandTotalCost = 0;
    const processedItems = [];

    // --- Process Each Item ---
    for (const item of items) {
      if (!item.barcode || !item.productName || item.quantityImported == null || item.ratePerItem == null) {
        throw new Error(`Missing data for an item. Barcode: ${item.barcode || 'N/A'}. All items require barcode, name, quantity, and rate.`);
      }

      const quantityImported = parseInt(item.quantityImported, 10);
      if (isNaN(quantityImported) || quantityImported <= 0) {
        throw new Error(`Quantity for item ${item.productName} must be a positive number.`);
      }

      let productId;
      let existingProduct = await db.collection('products').findOne({ barcode: item.barcode });

      if (item.isNewProduct && !existingProduct) {
        // --- Create New Product ---
        console.log(`API: Item '${item.productName}' is new. Creating product.`);
        
        if (item.newProductDetails.price == null || String(item.newProductDetails.price).trim() === "") {
            throw new Error(`Selling price is required for new product '${item.productName}'.`);
        }
        const parsedPrice = parseFloat(item.newProductDetails.price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            throw new Error(`Selling price for new product '${item.productName}' must be a positive number.`);
        }
        
        // MODIFIED: Removed category from new product data object
        const newProductData = {
          barcode: item.barcode,
          name: item.productName,
          price: parsedPrice,
          currentStock: quantityImported,
          totalImportedEver: quantityImported,
          totalSoldEver: 0,
          lowStockThreshold: parseInt(item.newProductDetails.lowStockThreshold, 10) || 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const insertResult = await db.collection('products').insertOne(newProductData);
        productId = insertResult.insertedId;
        await syncProductToRTDB({ _id: productId, ...newProductData });

      } else {
        // --- Update Existing Product ---
        if (!existingProduct) {
          throw new Error(`Product with barcode ${item.barcode} was expected to exist but was not found.`);
        }
        console.log(`API: Item '${existingProduct.name}' exists. Updating stock.`);
        productId = existingProduct._id;

        const updateResult = await db.collection('products').updateOne(
          { _id: productId },
          { 
            $inc: { 
              currentStock: quantityImported,
              totalImportedEver: quantityImported,
            },
            $set: { updatedAt: new Date() }
          }
        );
        
        if(updateResult.modifiedCount === 1) {
          const newStock = (existingProduct.currentStock || 0) + quantityImported;
          await updateProductInRTDB(existingProduct.barcode, { currentStock: newStock });
        }
      }
      
      const totalCostForItem = parseFloat(item.ratePerItem) * quantityImported;
      grandTotalCost += totalCostForItem;
      processedItems.push({
        productId: new ObjectId(productId),
        barcode: item.barcode,
        productName: existingProduct?.name || item.productName,
        quantityImported: quantityImported,
        ratePerItem: parseFloat(item.ratePerItem),
        totalCostForItem: totalCostForItem,
      });
    }

    // --- Create Ledger Entry ---
    const newLedgerEntry = {
      importerId: new ObjectId(importerId),
      importDate: new Date(importDate),
      invoiceNumber: invoiceNumber || null,
      items: processedItems,
      grandTotalCost: grandTotalCost,
      createdAt: new Date(),
      userId: user.uid,
    };
    
    const result = await db.collection('importLedgerEntries').insertOne(newLedgerEntry);
    const createdEntry = await db.collection('importLedgerEntries').findOne({_id: result.insertedId});
    
    return NextResponse.json({ success: true, message: 'Import ledger entry created successfully.', entry: createdEntry }, { status: 201 });

  } catch (error) {
    console.error("API: CRITICAL ERROR in POST /api/admin/import-ledger:", error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Duplicate key error, possibly related to product creation if barcodes conflict.', error: error.message }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: `Failed to create import ledger entry: ${error.message}` }, { status: 500 });
  }
});

// GET all import ledger entries (for the main list view)
export const GET = withAdminAuth(async function GET(request, { user }) {
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
    return NextResponse.json({ success: true, entries }, { status: 200 });
  } catch (error) {
    console.error("API: CRITICAL ERROR in GET /api/admin/import-ledger:", error);
    return NextResponse.json({ success: false, message: 'Failed to fetch import ledger entries', error: error.message }, { status: 500 });
  }
});