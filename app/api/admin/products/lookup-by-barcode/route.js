import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAdminAuth } from '@/utils/apiAuth';

export const GET = withAdminAuth(async function GET(request, { user }) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');

    if (!barcode) {
      return NextResponse.json({ success: false, message: 'Barcode query parameter is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const product = await db.collection('products').findOne({ barcode });

    if (!product) {
      return NextResponse.json({ success: true, product: null, message: 'Product not found.' }, { status: 200 }); // Still success, product is just null
    }

    return NextResponse.json({ success: true, product }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch product by barcode:", error);
    return NextResponse.json({ success: false, message: 'Failed to fetch product by barcode', error: error.message }, { status: 500 });
  }
});