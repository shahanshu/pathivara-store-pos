import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/utils/withAuth'; // General auth HOC

export const GET = withAuth(async function getProductsByPrice(request, { user }) {

  try {
    const { searchParams } = new URL(request.url);
    const priceParam = searchParams.get('price');

    if (priceParam === null || priceParam === undefined) {
      return NextResponse.json({ success: false, message: 'Price parameter is required.' }, { status: 400 });
    }

    const price = parseFloat(priceParam);
    if (isNaN(price) || price < 0) { // Allow price to be 0 for free items
      return NextResponse.json({ success: false, message: 'Invalid price value. Must be a non-negative number.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Find products matching the exact price and have stock
    const products = await db.collection('products')
      .find({ 
        price: price, 
        currentStock: { $gt: 0 } 
      })
      .project({ name: 1, barcode: 1, price: 1, currentStock: 1, _id: 1 }) // Include _id
      .limit(50) // Limit results for performance and UI manageability
      .toArray();

    return NextResponse.json({ success: true, products: products });

  } catch (error) {
    console.error('API Error fetching products by price:', error);
    return NextResponse.json({ success: false, message: 'Internal server error while fetching products by price.', errorDetails: error.message }, { status: 500 });
  }
});