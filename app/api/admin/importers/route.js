
// File: app/api/admin/importers/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAdminAuth } from '@/utils/apiAuth';

// GET all importers
export const GET = withAdminAuth(async function GET(request, { user }) {
  try {
    const { db } = await connectToDatabase();
    const importers = await db.collection('importers').find({}).sort({ name: 1 }).toArray();
    return NextResponse.json({ success: true, importers }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch importers:", error);
    return NextResponse.json({ success: false, message: 'Failed to fetch importers', error: error.message }, { status: 500 });
  }
});

// POST a new importer
export const POST = withAdminAuth(async function POST(request, { user }) {
  try {
    const { db } = await connectToDatabase();
    const importerData = await request.json();

    if (!importerData.name || !importerData.panNumber) {
      return NextResponse.json({ success: false, message: 'Importer name and PAN number are required.' }, { status: 400 });
    }

    // Check for existing PAN number to ensure uniqueness
    const existingImporter = await db.collection('importers').findOne({ panNumber: importerData.panNumber });
    if (existingImporter) {
      return NextResponse.json({ success: false, message: 'An importer with this PAN number already exists.' }, { status: 409 });
    }

    const newImporter = {
      ...importerData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('importers').insertOne(newImporter);
    const createdImporter = await db.collection('importers').findOne({ _id: result.insertedId });

    return NextResponse.json({ success: true, message: 'Importer created successfully', importer: createdImporter }, { status: 201 });
  } catch (error) {
    console.error("Failed to create importer:", error);
    if (error.code === 11000) {
        return NextResponse.json({ success: false, message: 'Duplicate key error. An importer with similar unique fields might already exist.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Failed to create importer', error: error.message }, { status: 500 });
  }
});