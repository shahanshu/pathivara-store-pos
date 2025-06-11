import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAdminAuth } from '@/utils/apiAuth';
import { syncProductToRTDB } from '@/lib/firebaseSync'; // Import the sync function

export const GET = withAdminAuth(async function GET(request, { user }) {
  try {
    const { db } = await connectToDatabase();
    const products = await db.collection('products').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, products }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ success: false, message: 'Failed to fetch products', error: error.message }, { status: 500 });
  }
});

export const POST = withAdminAuth(async function POST(request, { user }) {
  let createdProductInMongo; // To hold the product created in MongoDB

  try {
    const { db } = await connectToDatabase();
    const productData = await request.json();

    if (!productData.name || !productData.price || !productData.barcode) {
      return NextResponse.json({ success: false, message: 'Missing required product fields (name, price, barcode)' }, { status: 400 });
    }

    const existingProduct = await db.collection('products').findOne({ barcode: productData.barcode });
    if (existingProduct) {
      return NextResponse.json({ success: false, message: 'Product with this barcode already exists' }, { status: 409 });
    }

    const newProduct = {
      ...productData,
      currentStock: productData.currentStock || 0,
      totalImportedEver: productData.totalImportedEver || 0,
      totalSoldEver: 0,
      category: productData.category || null,
      lowStockThreshold: productData.lowStockThreshold || 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('products').insertOne(newProduct);
    // Fetch the complete product document from MongoDB as it now has _id and other defaults
    createdProductInMongo = await db.collection('products').findOne({ _id: result.insertedId });

    if (!createdProductInMongo) {
      // This should ideally not happen if insertOne was successful
      console.error("Failed to fetch created product from MongoDB immediately after insert.");
      return NextResponse.json({ success: false, message: 'Failed to confirm product creation in MongoDB' }, { status: 500 });
    }

    // After successful MongoDB operation, sync to Firebase RTDB
    // We pass createdProductInMongo because it contains all necessary fields including defaults
    await syncProductToRTDB(createdProductInMongo); 

    return NextResponse.json({ success: true, message: 'Product created and synced successfully', product: createdProductInMongo }, { status: 201 });

  } catch (error) {
    console.error("Failed to create product:", error);
    // Note: If MongoDB operation succeeds but RTDB sync fails, the API might have already responded
    // or will error out here. Consider more robust error handling/rollback for production.
    // For now, if RTDB sync throws an unhandled error, this catch block will handle it.
    if (error.code === 11000) { // MongoDB duplicate key error
      return NextResponse.json({ success: false, message: 'Duplicate key error. A product with similar unique fields might already exist.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Failed to create product or sync to RTDB', error: error.message }, { status: 500 });
  }
});