// File: app/api/admin/members/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAdminAuth } from '@/utils/apiAuth'; // For admin-specific actions
import { rtdbAdmin } from '@/lib/firebase-admin'; // For RTDB sync

// GET all members
export const GET = withAdminAuth(async function GET_Members(request, { user }) {
    try {
        const { db } = await connectToDatabase();
        const members = await db.collection('members')
            .find({})
            .sort({ createdAt: -1 }) // Sort by newest first, for example
            .toArray();
        return NextResponse.json({ success: true, members }, { status: 200 });
    } catch (error) {
        console.error("API Error: Failed to fetch members:", error);
        return NextResponse.json({ success: false, message: 'Failed to fetch members', error: error.message }, { status: 500 });
    }
});

// POST a new member (can be used by admin or cashier with appropriate auth)
// For now, using withAdminAuth, can be changed to a general withAuth + role check
export const POST = withAdminAuth(async function POST_CreateMember(request, { user }) {
    try {
        const { db } = await connectToDatabase();
        const memberData = await request.json();

        if (!memberData.name || !memberData.phoneNumber) {
            return NextResponse.json({ success: false, message: 'Member name and phone number are required.' }, { status: 400 });
        }

        // Basic phone number validation (e.g., 10 digits - adapt as needed for your region)
        if (!/^\d{10}$/.test(memberData.phoneNumber)) {
            // This regex is a simple 10-digit check. Adjust for international numbers if needed.
            return NextResponse.json({ success: false, message: 'Phone number must be 10 digits.' }, { status: 400 });
        }

        // Check for existing phone number to ensure uniqueness
        const existingMember = await db.collection('members').findOne({ phoneNumber: memberData.phoneNumber });
        if (existingMember) {
            return NextResponse.json({ success: false, message: 'A member with this phone number already exists.' }, { status: 409 });
        }

        const newMember = {
            name: memberData.name,
            phoneNumber: memberData.phoneNumber,
            totalPurchaseValue: 0, // Initial purchase value is 0
            createdAt: new Date(),
            updatedAt: new Date(),
            // createdBy: user.uid, // Optional: track who created the member
        };

        const result = await db.collection('members').insertOne(newMember);
        // Fetch the created member to include the _id in the response
        const createdMember = await db.collection('members').findOne({ _id: result.insertedId });

        if (createdMember) {
            // Sync to Firebase RTDB for cashier fast lookup
            try {
                const memberPhoneRef = rtdbAdmin.ref(`memberPhoneNumbers/${createdMember.phoneNumber}`);
                await memberPhoneRef.set({
                    memberId: createdMember._id.toString(), // Store MongoDB _id as string
                    name: createdMember.name
                });
                console.log(`Synced new member ${createdMember.phoneNumber} to RTDB /memberPhoneNumbers`);
            } catch (rtdbError) {
                console.error("RTDB Sync Error: Failed to sync new member to RTDB:", rtdbError);
                // Log this error, but don't fail the member creation if MongoDB part succeeded.
                // Potentially add to a retry queue or administrative alert.
            }
        }

        return NextResponse.json({ success: true, message: 'Member created successfully', member: createdMember }, { status: 201 });
    } catch (error) {
        console.error("API Error: Failed to create member:", error);
        if (error.code === 11000) { // MongoDB duplicate key error (though we explicitly check phoneNumber)
            return NextResponse.json({ success: false, message: 'Duplicate key error. This member might already exist with unique constraints.' }, { status: 409 });
        }
        return NextResponse.json({ success: false, message: 'Failed to create member', error: error.message }, { status: 500 });
    }
});