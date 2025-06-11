import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAdminAuth } from '@/utils/apiAuth';
import { syncProductToRTDB, removeProductFromRTDB } from '@/lib/firebaseSync';

// Define the core logic for GET separately
async function handleGetProduct(request, context) {
  // context here is { params: Promise<{ productId: '...' }> | { productId: '...' } , user: { ... } }
  
  // Await the params from the context
  const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
  const productId = resolvedParams?.productId;

  if (!productId) {
    return NextResponse.json({ success: false, message: 'Product ID not found in parameters' }, { status: 400 });
  }
  if (!ObjectId.isValid(productId)) {
    return NextResponse.json({ success: false, message: 'Invalid Product ID format' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, product }, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch product ${productId}:`, error);
    return NextResponse.json({ success: false, message: 'Failed to fetch product', error: error.message }, { status: 500 });
  }
}

// Define the core logic for PUT separately
async function handleUpdateProduct(request, context) {
  const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
  const productId = resolvedParams?.productId;
  // const user = context?.user; // User from withAdminAuth (already resolved in HOC)

  if (!productId) {
    return NextResponse.json({ success: false, message: 'Product ID not found in parameters' }, { status: 400 });
  }
  if (!ObjectId.isValid(productId)) {
    return NextResponse.json({ success: false, message: 'Invalid Product ID format' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const productDataToUpdate = await request.json();

    // Validations (ensure these are complete as per your needs)
    if (productDataToUpdate.price !== undefined && (isNaN(parseFloat(productDataToUpdate.price)) || parseFloat(productDataToUpdate.price) <= 0)) {
        return NextResponse.json({ success: false, message: 'Price must be a positive number.' }, { status: 400 });
    }
    if (productDataToUpdate.currentStock !== undefined && (isNaN(parseInt(productDataToUpdate.currentStock)) || parseInt(productDataToUpdate.currentStock) < 0)) {
      return NextResponse.json({ success: false, message: 'Current stock must be a non-negative number.' }, { status: 400 });
    }
    if (productDataToUpdate.lowStockThreshold !== undefined && (isNaN(parseInt(productDataToUpdate.lowStockThreshold)) || parseInt(productDataToUpdate.lowStockThreshold) < 0)) {
        return NextResponse.json({ success: false, message: 'Low stock threshold must be a non-negative number.' }, { status: 400 });
    }


    if (productDataToUpdate.barcode) {
        const originalProduct = await db.collection('products').findOne({ _id: new ObjectId(productId) });
        if (originalProduct && originalProduct.barcode !== productDataToUpdate.barcode) {
            return NextResponse.json({ success: false, message: 'Barcode cannot be changed.' }, { status: 400 });
        }
        delete productDataToUpdate.barcode; 
    }

    const updateDoc = { $set: { ...productDataToUpdate, updatedAt: new Date() } };
    delete updateDoc.$set._id; 
    delete updateDoc.$set.createdAt;
    delete updateDoc.$set.totalImportedEver;
    delete updateDoc.$set.totalSoldEver;

    const result = await db.collection('products').updateOne({ _id: new ObjectId(productId) }, updateDoc);

    if (result.matchedCount === 0) return NextResponse.json({ success: false, message: 'Product not found for update' }, { status: 404 });
    
    const updatedProduct = await db.collection('products').findOne({ _id: new ObjectId(productId) });
    if (updatedProduct) await syncProductToRTDB(updatedProduct);
    
    let message = 'Product updated successfully';
    if (result.modifiedCount === 0 && result.matchedCount === 1 && updatedProduct) { // ensure updatedProduct exists for message
        message = 'No changes detected in product data.';
    }
    
    return NextResponse.json({ success: true, message, product: updatedProduct }, { status: 200 });

  } catch (error) {
    console.error(`Failed to update product ${productId}:`, error);
    return NextResponse.json({ success: false, message: 'Failed to update product', error: error.message }, { status: 500 });
  }
}

// Define the core logic for DELETE separately
async function handleDeleteProduct(request, context) {
  const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
  const productId = resolvedParams?.productId;

  if (!productId) return NextResponse.json({ success: false, message: 'Product ID not found' }, { status: 400 });
  if (!ObjectId.isValid(productId)) return NextResponse.json({ success: false, message: 'Invalid Product ID' }, { status: 400 });

  try {
    const { db } = await connectToDatabase();
    const productToDelete = await db.collection('products').findOne({ _id: new ObjectId(productId) });

    if (!productToDelete) return NextResponse.json({ success: false, message: 'Product not found for deletion' }, { status: 404 });

    const result = await db.collection('products').deleteOne({ _id: new ObjectId(productId) });
    if (result.deletedCount === 0) return NextResponse.json({ success: false, message: 'Product not found or already deleted' }, { status: 404 });

    await removeProductFromRTDB(productToDelete.barcode);
    return NextResponse.json({ success: true, message: 'Product deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error(`Failed to delete product ${productId}:`, error);
    return NextResponse.json({ success: false, message: 'Failed to delete product', error: error.message }, { status: 500 });
  }
}

// Export wrapped handlers
export const GET = withAdminAuth(handleGetProduct);
export const PUT = withAdminAuth(handleUpdateProduct);
export const DELETE = withAdminAuth(handleDeleteProduct);