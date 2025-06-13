// File: app/api/admin/importers/[importersId]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAdminAuth } from '@/utils/apiAuth';

// GET a specific importer by ID
export const GET = withAdminAuth(async function GET(request, context) {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    // CRITICAL FIX: Read the parameter matching the directory name "[importersId]"
    const importerIdValue = resolvedParams?.importersId;

    if (!importerIdValue) {
        return NextResponse.json({ success: false, message: 'Importer ID (importersId) not found in parameters' }, { status: 400 });
    }
    if (!ObjectId.isValid(importerIdValue)) {
        return NextResponse.json({ success: false, message: 'Invalid Importer ID format' }, { status: 400 });
    }

    try {
        const { db } = await connectToDatabase();
        const importer = await db.collection('importers').findOne({ _id: new ObjectId(importerIdValue) });

        if (!importer) {
            return NextResponse.json({ success: false, message: 'Importer not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, importer }, { status: 200 });
    } catch (error) {
        console.error(`Failed to fetch importer ${importerIdValue}:`, error);
        return NextResponse.json({ success: false, message: 'Failed to fetch importer', error: error.message }, { status: 500 });
    }
});

// PUT (Update) a specific importer by ID
export const PUT = withAdminAuth(async function PUT(request, context) {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    // CRITICAL FIX: Read the parameter matching the directory name "[importersId]"
    const importerIdValue = resolvedParams?.importersId;

    if (!importerIdValue) {
        return NextResponse.json({ success: false, message: 'Importer ID (importersId) not found in parameters' }, { status: 400 });
    }
    if (!ObjectId.isValid(importerIdValue)) {
        return NextResponse.json({ success: false, message: 'Invalid Importer ID format' }, { status: 400 });
    }

    try {
        const { db } = await connectToDatabase();
        const importerDataToUpdate = await request.json();

        if (!importerDataToUpdate.name || !importerDataToUpdate.panNumber) {
            return NextResponse.json({ success: false, message: 'Importer name and PAN number are required.' }, { status: 400 });
        }

        if (importerDataToUpdate.panNumber) {
            const existingImporterWithPan = await db.collection('importers').findOne({
                panNumber: importerDataToUpdate.panNumber,
                _id: { $ne: new ObjectId(importerIdValue) }
            });
            if (existingImporterWithPan) {
                return NextResponse.json({ success: false, message: 'Another importer with this PAN number already exists.' }, { status: 409 });
            }
        }
        
        const updateDoc = {
            $set: {
                ...importerDataToUpdate,
                updatedAt: new Date(),
            },
        };
        delete updateDoc.$set._id;
        delete updateDoc.$set.createdAt;

        const result = await db.collection('importers').updateOne({ _id: new ObjectId(importerIdValue) }, updateDoc);

        if (result.matchedCount === 0) {
            return NextResponse.json({ success: false, message: 'Importer not found for update' }, { status: 404 });
        }

        const updatedImporter = await db.collection('importers').findOne({ _id: new ObjectId(importerIdValue) });
        return NextResponse.json({ success: true, message: 'Importer updated successfully', importer: updatedImporter }, { status: 200 });
    } catch (error) {
        console.error(`Failed to update importer ${importerIdValue}:`, error);
        if (error.code === 11000) {
            return NextResponse.json({ success: false, message: 'Duplicate key error. An importer with this PAN number might already exist.' }, { status: 409 });
        }
        return NextResponse.json({ success: false, message: 'Failed to update importer', error: error.message }, { status: 500 });
    }
});

// DELETE a specific importer by ID
export const DELETE = withAdminAuth(async function DELETE(request, context) {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    // CRITICAL FIX: Read the parameter matching the directory name "[importersId]"
    const importerIdValue = resolvedParams?.importersId;

    if (!importerIdValue) {
        // Updated error message slightly for clarity during debugging
        return NextResponse.json({ success: false, message: 'Importer ID (from importersId param) not found in parameters.' }, { status: 400 });
    }
    if (!ObjectId.isValid(importerIdValue)) {
        return NextResponse.json({ success: false, message: 'Invalid Importer ID format.' }, { status: 400 });
    }

    try {
        const { db } = await connectToDatabase();

        const linkedEntries = await db.collection('importLedgerEntries').countDocuments({ importerId: new ObjectId(importerIdValue) });
        if (linkedEntries > 0) {
            return NextResponse.json({
                success: false,
                message: `Cannot delete importer. It is linked to ${linkedEntries} import ledger entries. Please remove those entries first or disassociate the importer.`
            }, { status: 400 });
        }

        const result = await db.collection('importers').deleteOne({ _id: new ObjectId(importerIdValue) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ success: false, message: 'Importer not found or already deleted' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Importer deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Failed to delete importer ${importerIdValue}:`, error);
        return NextResponse.json({ success: false, message: 'Failed to delete importer', error: error.message }, { status: 500 });
    }
});
// ----- End of File: app/api/admin/importers/[importersId]/route.js -----