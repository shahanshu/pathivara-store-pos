// File: app/api/members/lookup/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/utils/withAuth'; // General auth, not admin-specific

export const GET = withAuth(async function lookupMember(request, { user }) {
    try {
        const { searchParams } = new URL(request.url);
        const phoneNumber = searchParams.get('phoneNumber');

        if (!phoneNumber) {
            return NextResponse.json({ success: false, message: 'Phone number query parameter is required.' }, { status: 400 });
        }
        if (!/^\d{10}$/.test(phoneNumber)) {
            return NextResponse.json({ success: false, message: 'Invalid phone number format. Must be 10 digits.' }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        const member = await db.collection('members').findOne({ phoneNumber: phoneNumber });

        if (!member) {
            return NextResponse.json({ success: true, member: null, message: 'Member not found.' }, { status: 200 }); // Return 200 even if not found, with member: null
        }

        // Return only necessary fields for cashier confirmation to minimize data exposure
        const memberForCashier = {
            _id: member._id,
            name: member.name,
            phoneNumber: member.phoneNumber,
            // Do not return totalPurchaseValue here unless specifically needed by cashier UI beyond confirmation
        };

        return NextResponse.json({ success: true, member: memberForCashier }, { status: 200 });

    } catch (error) {
        console.error("API Error: Failed to lookup member by phone:", error);
        return NextResponse.json({ success: false, message: 'Failed to lookup member', error: error.message }, { status: 500 });
    }
});