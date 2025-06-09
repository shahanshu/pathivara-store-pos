// app/api/admin/products/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; // Adjust path if necessary
// We'll need to secure this API route later
// import { getAuth } from 'firebase-admin/auth'; // For server-side auth check
// import { initAdminApp } from '@/lib/firebase-admin'; // Your Firebase Admin init

export async function GET(request) {
  // TODO: Add authentication and authorization check (ensure user is admin)
  // For now, we'll proceed without it for initial setup.

  try {
    const { db } = await connectToDatabase();
    const products = await db.collection('products').find({}).sort({ createdAt: -1 }).toArray(); // Get all, sorted by newest

    return NextResponse.json({ success: true, products }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ success: false, message: 'Failed to fetch products', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  // TODO: Add authentication and authorization check
  try {
    const { db } = await connectToDatabase();
    const productData = await request.json();

    // Basic Validation (more robust validation should be added)
    if (!productData.name || !productData.price || !productData.barcode) {
      return NextResponse.json({ success: false, message: 'Missing required product fields (name, price, barcode)' }, { status: 400 });
    }

    // Check if barcode already exists
    const existingProduct = await db.collection('products').findOne({ barcode: productData.barcode });
    if (existingProduct) {
        return NextResponse.json({ success: false, message: 'Product with this barcode already exists' }, { status: 409 }); // 409 Conflict
    }

    const newProduct = {
      ...productData,
      currentStock: productData.currentStock || 0,
      totalImportedEver: productData.totalImportedEver || 0,
      lowStockThreshold: productData.lowStockThreshold || 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('products').insertOne(newProduct);

    // After insertOne, result.insertedId will contain the _id of the new document
    // To return the full document, you might need another fetch or construct it.
    // For simplicity, we can return the input data + generated fields if needed,
    // or just success. Let's return the created product for now.
    const createdProduct = await db.collection('products').findOne({ _id: result.insertedId });


    return NextResponse.json({ success: true, message: 'Product created successfully', product: createdProduct }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    if (error.code === 11000) { // MongoDB duplicate key error (if you add more unique indexes)
        return NextResponse.json({ success: false, message: 'Duplicate key error. A product with similar unique fields might already exist.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Failed to create product', error: error.message }, { status: 500 });
  }
}