import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAdminAuth } from '@/utils/apiAuth';

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
    const createdProduct = await db.collection('products').findOne({ _id: result.insertedId });

    return NextResponse.json({ success: true, message: 'Product created successfully', product: createdProduct }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Duplicate key error. A product with similar unique fields might already exist.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Failed to create product', error: error.message }, { status: 500 });
  }
});