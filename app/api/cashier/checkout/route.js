// File: app/api/cashier/checkout/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/utils/withAuth';
import { updateProductInRTDB, addRecentCashierTransaction } from '@/lib/firebaseSync';

// Helper function to generate a unique transaction ID
function generateTransactionId() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SALE-${yyyy}${mm}${dd}-${hh}${min}${ss}-${randomSuffix}`;
}

export const POST = withAuth(async function checkout(request, { user }) {
    const cashierId = user.uid;
    let session; // For MongoDB transaction

    // Declare these variables outside the transaction block to be accessible in the finally/RTDB sync block
    let createdSale;
    let productUpdatesForRTDB = [];
    let itemsForTransactionForRTDBSync = []; // To hold items for recent transaction sync


    try {
        const mongo = await connectToDatabase();
        const db = mongo.db;
        session = mongo.client.startSession(); // Start a MongoDB session

        const { cart, paymentMethod = "cash", memberId } = await request.json();

        if (!cart || cart.length === 0) {
            return NextResponse.json({ success: false, message: 'Cart is empty.' }, { status: 400 });
        }

        await session.withTransaction(async () => {
            const productCollection = db.collection('products');
            const salesTransactionCollection = db.collection('salesTransactions');
            const membersCollection = db.collection('members');

            let subTotal = 0;
            const itemsForTransaction = []; // This one is local to the transaction block for Mongo document
            const productUpdatesForMongo = [];
            // productUpdatesForRTDB and itemsForTransactionForRTDBSync are already initialized in the outer scope

            for (const cartItem of cart) {
                const product = await productCollection.findOne({ barcode: cartItem.barcode }, { session });
                if (!product) {
                    // This error will cause the transaction to abort
                    throw new Error(`Product with barcode ${cartItem.barcode} not found during checkout.`);
                }
                if (product.currentStock < cartItem.quantityInCart) {
                    // This error will cause the transaction to abort
                    throw new Error(`Not enough stock for ${product.name}. Available: ${product.currentStock}, Requested: ${cartItem.quantityInCart}.`);
                }

                const itemTotal = cartItem.quantityInCart * product.price; // Use current price from DB
                subTotal += itemTotal;

                // For MongoDB salesTransaction.items
                itemsForTransaction.push({
                    productId: product._id,
                    barcode: product.barcode,
                    productName: product.name,
                    quantitySold: cartItem.quantityInCart,
                    priceAtSale: product.price, // Price at the time of sale from DB
                    itemTotal: itemTotal,
                });

                // For RTDB sync itemCount calculation (after successful transaction)
                itemsForTransactionForRTDBSync.push({
                    quantitySold: cartItem.quantityInCart
                });

                // Prepare updates for MongoDB products collection
                productUpdatesForMongo.push({
                    updateOne: {
                        filter: { _id: product._id },
                        update: {
                            $inc: {
                                currentStock: -cartItem.quantityInCart,
                                totalSoldEver: cartItem.quantityInCart,
                            },
                            $set: { updatedAt: new Date() }
                        }
                    }
                });

                // Prepare updates for Firebase RTDB (to be executed after successful transaction)
                productUpdatesForRTDB.push({
                    barcode: product.barcode,
                    updates: { currentStock: product.currentStock - cartItem.quantityInCart }
                });
            }

            // Perform MongoDB product stock updates
            if (productUpdatesForMongo.length > 0) {
                const productUpdateResults = await productCollection.bulkWrite(productUpdatesForMongo, { session });
                if (productUpdateResults.modifiedCount !== productUpdatesForMongo.length) {
                    console.warn("CHECKOUT_WARNING: Not all product stock updates were successful during MongoDB bulkWrite.", productUpdateResults);
                    // Depending on strictness, you might throw an error here to abort the transaction
                    // throw new Error("Failed to update all product stocks consistently.");
                }
            }

            // Create the sales transaction document in MongoDB
            const transactionId = generateTransactionId();
            const newSale = {
                transactionId: transactionId,
                cashierId: cashierId,
                transactionDate: new Date(),
                items: itemsForTransaction,
                subTotal: subTotal,
                discountAmount: 0, // Placeholder for future discount feature
                grandTotal: subTotal, // Assuming no discount for now
                paymentMethod: paymentMethod,
                status: 'completed', // Default status
                memberId: memberId ? new ObjectId(memberId) : null, // Store ObjectId if memberId provided
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const saleResult = await salesTransactionCollection.insertOne(newSale, { session });
            // Fetch the complete createdSale document to return, including its _id
            createdSale = await salesTransactionCollection.findOne({ _id: saleResult.insertedId }, { session });

            if (!createdSale) {
                // This would be a critical issue if insertOne succeeded but findOne failed within the same transaction.
                throw new Error("Failed to retrieve the created sale immediately after insertion.");
            }

            // If memberId is present, update their totalPurchaseValue in MongoDB
            if (memberId && createdSale) { // Ensure createdSale is not null
                const memberUpdateResult = await membersCollection.updateOne(
                    { _id: new ObjectId(memberId) },
                    { $inc: { totalPurchaseValue: createdSale.grandTotal }, $set: { updatedAt: new Date() } },
                    { session }
                );
                if (memberUpdateResult.modifiedCount === 0) {
                    // This could happen if the memberId is valid ObjectId format but doesn't exist.
                    // Or if totalPurchaseValue was already up-to-date (less likely for $inc).
                    console.warn(`CHECKOUT_WARNING: Failed to update totalPurchaseValue for memberId: ${memberId}. Member might not exist, or no change was made.`);
                    // Depending on business logic, you might throw an error here to abort if member update is critical.
                    // For now, it's a warning, and the sale itself is considered successful.
                }
            }
        }); // End of MongoDB transaction

        // If MongoDB transaction was successful, then sync to Firebase RTDB
        // These operations are outside the MongoDB transaction, so they are not atomic with it.
        // If these fail, the MongoDB data is already committed.
        // Consider a retry mechanism or a separate queue for failed RTDB updates in a production system.

        for (const rtdbUpdate of productUpdatesForRTDB) {
            try {
                await updateProductInRTDB(rtdbUpdate.barcode, rtdbUpdate.updates);
            } catch (rtdbError) {
                console.error(`RTDB Sync Error (Stock Update) for barcode ${rtdbUpdate.barcode}:`, rtdbError);
                // Log and continue. The primary (MongoDB) operation was successful.
            }
        }

        if (createdSale) { // Ensure createdSale is available before trying to use it for RTDB sync
            try {
                const itemCountForRTDB = itemsForTransactionForRTDBSync.reduce((sum, i) => sum + i.quantitySold, 0);
                await addRecentCashierTransaction(cashierId, {
                    mongoTransactionId: createdSale.transactionId, // Use the custom transactionId
                    grandTotal: createdSale.grandTotal,
                    itemCount: itemCountForRTDB,
                    status: createdSale.status,
                });
            } catch (rtdbError) {
                console.error(`RTDB Sync Error (Recent Transaction) for cashier ${cashierId}:`, rtdbError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Checkout successful!',
            transaction: createdSale // Return the full createdSale object from MongoDB
        }, { status: 201 });

    } catch (error) {
        console.error('Checkout API Error:', error);
        // Differentiate user-facing errors (like stock issues) from internal server errors
        if (error.message.includes("Not enough stock") || error.message.includes("not found during checkout")) {
            return NextResponse.json({ success: false, message: error.message }, { status: 400 }); // Bad request
        }
        return NextResponse.json({ success: false, message: `An internal server error occurred during checkout: ${error.message}` }, { status: 500 });
    } finally {
        if (session) {
            await session.endSession();
        }
    }
});