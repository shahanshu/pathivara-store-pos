// File: app/api/admin/products/route.js

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAdminAuth } from '@/utils/apiAuth';
import { syncProductToRTDB } from '@/lib/firebaseSync';

// GET all products
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

// POST a new product
export const POST = withAdminAuth(async function POST(request, { user }) {
  let createdProductInMongo;
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

    // Use the totalImportedEver from the form and apply robust defaults
    const currentStock = productData.currentStock ?? 0;
    const totalImportedEver = productData.totalImportedEver ?? currentStock;

    // Server-side validation
    if(currentStock > totalImportedEver) {
      return NextResponse.json({ success: false, message: 'Current Stock cannot be greater than Total Imported.' }, { status: 400 });
    }
    
    // MODIFIED: Removed 'category' from the new product object definition
    const newProduct = {
      ...productData,
      currentStock: currentStock,
      totalImportedEver: totalImportedEver,
      totalSoldEver: 0,
      lowStockThreshold: productData.lowStockThreshold ?? 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Explicitly delete the category field in case it is sent from the client
    delete newProduct.category;

    const result = await db.collection('products').insertOne(newProduct);
    createdProductInMongo = await db.collection('products').findOne({ _id: result.insertedId });

    if (!createdProductInMongo) {
      console.error("Failed to fetch created product from MongoDB immediately after insert.");
      return NextResponse.json({ success: false, message: 'Failed to confirm product creation in MongoDB' }, { status: 500 });
    }

    await syncProductToRTDB(createdProductInMongo);

    return NextResponse.json({ success: true, message: 'Product created and synced successfully', product: createdProductInMongo }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Duplicate key error. A product with similar unique fields might already exist.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: `Failed to create product or sync to RTDB: ${error.message}` }, { status: 500 });
  }
});