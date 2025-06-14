// app/api/cashier/checkout/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAdminAuth } from '@/utils/apiAuth'; // Using withAdminAuth, implies admin can also checkout
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

export const POST = withAdminAuth(async function checkout(request, { user }) {
  // user object comes from withAdminAuth (decoded Firebase token)
  const cashierId = user.uid;

  try {
    const { db } = await connectToDatabase();
    const { cart, paymentMethod = "cash" } = await request.json(); // paymentMethod can be passed from client

    if (!cart || cart.length === 0) {
      return NextResponse.json({ success: false, message: 'Cart is empty.' }, { status: 400 });
    }

    const productCollection = db.collection('products');
    const salesTransactionCollection = db.collection('salesTransactions');
    
    let subTotal = 0;
    const itemsForTransaction = [];
    const productUpdates = []; // To store updates for RTDB sync

    // --- Step 1: Validate cart items and check stock (critical server-side check) ---
    for (const cartItem of cart) {
      const product = await productCollection.findOne({ barcode: cartItem.barcode });

      if (!product) {
        return NextResponse.json({ success: false, message: `Product with barcode ${cartItem.barcode} not found.` }, { status: 404 });
      }
      if (product.currentStock < cartItem.quantityInCart) {
        return NextResponse.json({ success: false, message: `Not enough stock for ${product.name}. Available: ${product.currentStock}, Requested: ${cartItem.quantityInCart}.` }, { status: 400 });
      }

      const itemTotal = cartItem.quantityInCart * product.price; // Use current price from DB
      subTotal += itemTotal;

      itemsForTransaction.push({
        productId: product._id,
        barcode: product.barcode,
        productName: product.name,
        quantitySold: cartItem.quantityInCart,
        priceAtSale: product.price, // Price at the time of sale
        itemTotal: itemTotal,
      });

      // Prepare updates for MongoDB products collection
      productUpdates.push({
        updateOne: {
          filter: { _id: product._id },
          update: {
            $inc: {
              currentStock: -cartItem.quantityInCart,
              totalSoldEver: cartItem.quantityInCart,
            },
            $set: { updatedAt: new Date() }
          },
        },
      });
    }

    // --- Step 2: Perform MongoDB operations (ideally within a transaction) ---
    // For simplicity, we'll do bulk operations without an explicit session transaction here.
    // In a production app with a replica set, use MongoDB sessions for atomicity.

    const productUpdateResults = await productCollection.bulkWrite(productUpdates);
    if (productUpdateResults.modifiedCount !== productUpdates.length) {
        // This indicates some products might not have been updated correctly.
        // Needs robust error handling/rollback strategy in production.
        console.warn("CHECKOUT_WARNING: Not all product stock updates were successful during bulkWrite.", productUpdateResults);
        // Potentially reverse stock changes or log for manual intervention
    }

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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const saleResult = await salesTransactionCollection.insertOne(newSale);
    const createdSale = await salesTransactionCollection.findOne({_id: saleResult.insertedId});


    // --- Step 3: Sync updated stock to Firebase RTDB ---
    // And add to recent cashier transactions
    for (const item of itemsForTransaction) {
      const updatedProduct = await productCollection.findOne({ barcode: item.barcode }); // Get fresh stock
      if (updatedProduct) {
        await updateProductInRTDB(item.barcode, { currentStock: updatedProduct.currentStock });
      }
    }
    
    await addRecentCashierTransaction(cashierId, {
        mongoTransactionId: transactionId, // Use the custom generated ID
        grandTotal: newSale.grandTotal,
        itemCount: itemsForTransaction.reduce((sum, i) => sum + i.quantitySold, 0),
        status: newSale.status,
    });

    return NextResponse.json({ 
        success: true, 
        message: 'Checkout successful!', 
        transaction: createdSale 
    }, { status: 201 });

  } catch (error) {
    console.error('Checkout API Error:', error);
    // Differentiate user errors from server errors if possible
    if (error.message.includes("Not enough stock") || error.message.includes("not found")) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'An internal server error occurred during checkout.' }, { status: 500 });
  }
});