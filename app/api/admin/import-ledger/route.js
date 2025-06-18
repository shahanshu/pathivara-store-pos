// File: app/api/admin/import-ledger/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAdminAuth } from '@/utils/apiAuth';
import { syncProductToRTDB, updateProductInRTDB } from '@/lib/firebaseSync'; // Assuming updateProductInRTDB exists or we use syncProductToRTDB

export const POST = withAdminAuth(async function POST(request, { user }) {
    console.log("API: Received POST request to /api/admin/import-ledger");
    const { db } = await connectToDatabase();
    // let session; // MongoDB session if needed for atomicity, not used in this simplified version

    try {
        // session = mongo.client.startSession(); // If using MongoDB transactions
        // await session.withTransaction(async () => { // If using MongoDB transactions

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
        const processedItemsForLedger = [];
        const productUpdateOpsForMongo = []; // For bulk updating existing products

        for (const item of items) {
            if (!item.barcode || !item.productName || item.quantityImported == null || item.ratePerItem == null) {
                // productName is required for new products, and used as fallback if existing product name not found (should not happen)
                return NextResponse.json({ success: false, message: `Missing data for an item. Barcode: ${item.barcode || 'N/A'}. All items require barcode, name, quantity, and rate.` }, { status: 400 });
            }

            const quantityImportedNum = parseInt(item.quantityImported, 10);
            const ratePerItemNum = parseFloat(item.ratePerItem);

            if (isNaN(quantityImportedNum) || quantityImportedNum <= 0) {
                return NextResponse.json({ success: false, message: `Quantity for item ${item.productName || item.barcode} must be a positive number.` }, { status: 400 });
            }
            if (isNaN(ratePerItemNum) || ratePerItemNum < 0) { // Rate can be 0 if it's a free item, but not negative
                return NextResponse.json({ success: false, message: `Rate for item ${item.productName || item.barcode} must be a non-negative number.` }, { status: 400 });
            }

            let productId;
            let actualProductName = item.productName; // Use provided name as default or for new product

            const existingProduct = await db.collection('products').findOne({ barcode: item.barcode });

            if (item.isNewProduct) {
                if (existingProduct) {
                    // Frontend indicated new, but barcode already exists. This is a conflict.
                    return NextResponse.json({ success: false, message: `Product with barcode ${item.barcode} already exists. Cannot create as new.` }, { status: 409 });
                }
                // Create New Product
                console.log(`API: Item '${item.productName}' (Barcode: ${item.barcode}) is new. Creating product.`);
                if (!item.newProductDetails || item.newProductDetails.price == null || String(item.newProductDetails.price).trim() === "") {
                    return NextResponse.json({ success: false, message: `Selling price is required for new product '${item.productName}'.` }, { status: 400 });
                }
                const sellingPriceNum = parseFloat(item.newProductDetails.price);
                if (isNaN(sellingPriceNum) || sellingPriceNum <= 0) {
                    return NextResponse.json({ success: false, message: `Selling price for new product '${item.productName}' must be a positive number.` }, { status: 400 });
                }
                const lowStockThresholdNum = parseInt(item.newProductDetails.lowStockThreshold, 10) || 10; // Default to 10

                const newProductData = {
                    barcode: item.barcode.trim(),
                    name: item.productName.trim(),
                    price: sellingPriceNum,
                    currentStock: quantityImportedNum,
                    totalImportedEver: quantityImportedNum,
                    totalSoldEver: 0,
                    lowStockThreshold: lowStockThresholdNum,
                    // No 'category' field
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                const insertResult = await db.collection('products').insertOne(newProductData); //, { session }); // if using session
                productId = insertResult.insertedId;
                actualProductName = newProductData.name; // Use the (potentially trimmed) name
                await syncProductToRTDB({ _id: productId, ...newProductData }); // Sync to RTDB
            
            } else { // Attempt to update existing product
                if (!existingProduct) {
                    return NextResponse.json({ success: false, message: `Product with barcode ${item.barcode} was marked as existing but not found in database.` }, { status: 404 });
                }
                console.log(`API: Item '${existingProduct.name}' (Barcode: ${item.barcode}) exists. Updating stock.`);
                productId = existingProduct._id;
                actualProductName = existingProduct.name; // Use actual name from DB

                // Prepare MongoDB update operation
                productUpdateOpsForMongo.push({
                    updateOne: {
                        filter: { _id: existingProduct._id },
                        update: {
                            $inc: {
                                currentStock: quantityImportedNum,
                                totalImportedEver: quantityImportedNum,
                            },
                            $set: { updatedAt: new Date() },
                        },
                    },
                });
            }

            const totalCostForItem = ratePerItemNum * quantityImportedNum;
            grandTotalCost += totalCostForItem;

            processedItemsForLedger.push({
                productId: new ObjectId(productId),
                barcode: item.barcode,
                productName: actualProductName,
                quantityImported: quantityImportedNum,
                ratePerItem: ratePerItemNum,
                totalCostForItem: totalCostForItem,
            });
        }

        // Perform bulk updates for existing products in MongoDB
        if (productUpdateOpsForMongo.length > 0) {
            console.log(`API: Performing ${productUpdateOpsForMongo.length} stock updates in MongoDB.`);
            const bulkWriteResult = await db.collection('products').bulkWrite(productUpdateOpsForMongo); //, { session }); // if using session
            console.log("API: MongoDB bulk write result:", bulkWriteResult);

            // Sync updated stock for these existing products to RTDB
            // Fetch the updated documents to get the new currentStock for RTDB sync
            const updatedBarcodes = productUpdateOpsForMongo.map(op => op.updateOne.filter.barcode || items.find(i => i.productId?.toString() === op.updateOne.filter._id?.toString())?.barcode); // Attempt to get barcodes
            
            for (const barcode of updatedBarcodes.filter(Boolean)) { // Filter out any undefined barcodes
                 const productToSync = await db.collection('products').findOne({ barcode: barcode });
                 if (productToSync) {
                    await syncProductToRTDB(productToSync); // syncProductToRTDB syncs name, price, currentStock
                 } else {
                    console.warn(`API: Could not find product with barcode ${barcode} for RTDB sync after stock update.`);
                 }
            }
        }

        // Create Ledger Entry
        const newLedgerEntry = {
            importerId: new ObjectId(importerId),
            importDate: new Date(importDate),
            invoiceNumber: invoiceNumber || null,
            items: processedItemsForLedger,
            grandTotalCost: grandTotalCost,
            createdAt: new Date(),
            userId: user.uid, // user.uid should be available from withAdminAuth
        };

        const result = await db.collection('importLedgerEntries').insertOne(newLedgerEntry); //, { session }); // if using session
        const createdEntry = await db.collection('importLedgerEntries').findOne({ _id: result.insertedId }); //, { session }); // if using session

        // }); // End of session.withTransaction() if used

        return NextResponse.json({ success: true, message: 'Import ledger entry created successfully.', entry: createdEntry }, { status: 201 });

    } catch (error) {
        console.error("API: CRITICAL ERROR in POST /api/admin/import-ledger:", error);
        let errorMessage = 'Failed to create import ledger entry.';
        let statusCode = 500;

        if (error.code === 11000) { // MongoDB duplicate key error
            errorMessage = 'Duplicate key error, possibly related to product creation if barcodes conflict in a race condition, or a unique index on importLedgerEntries.';
            statusCode = 409;
        } else if (error.message) {
            errorMessage = error.message;
            // Keep statusCode 500 unless specific known error type suggesting client error
            if (error.message.includes("must be a positive number") || error.message.includes("required for new product") || error.message.includes("already exists") || error.message.includes("not found")) {
                statusCode = 400; // More specific client-side correctable errors
            }
        }
        return NextResponse.json({ success: false, message: errorMessage, error: error.toString() }, { status: statusCode });
    } finally {
        // if (session) { // if using session
        //     await session.endSession();
        // }
    }
});

// GET all import ledger entries (for the main list view)
// This part of the file (app/api/admin/import-ledger/route.js) seems to be already present in your OCR (page 65)
// and is not directly related to the fix of POST request. Assuming it's correct.
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