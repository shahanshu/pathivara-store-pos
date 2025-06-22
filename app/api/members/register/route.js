// app/api/members/register/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/utils/withAuth'; // General auth
import { rtdbAdmin } from '@/lib/firebase-admin'; // For RTDB syn
import { ObjectId } from 'mongodb';


export const POST = withAuth(async function registerMember(request, { user }) {

  const userRole = user.selectedRole || (user.admin ? 'admin' : null);
  if (userRole !== 'cashier' && userRole !== 'admin') {
    return NextResponse.json({ success: false, message: 'Forbidden: Insufficient role' }, { status: 403 });
  }

  try {
    const { db } = await connectToDatabase();
    const memberData = await request.json();

    if (!memberData.name || !memberData.phoneNumber) {
      return NextResponse.json({ success: false, message: 'Member name and phone number are required.' }, { status: 400 });
    }
    if (!/^\d{10}$/.test(memberData.phoneNumber)) {
      return NextResponse.json({ success: false, message: 'Phone number must be 10 digits.' }, { status: 400 });
    }

    const existingMember = await db.collection('members').findOne({ phoneNumber: memberData.phoneNumber });
    if (existingMember) {
      return NextResponse.json({ success: false, message: 'A member with this phone number already exists.' }, { status: 409 });
    }

    const newMemberDocument = {
      name: memberData.name.trim(),
      phoneNumber: memberData.phoneNumber.trim(),
      totalPurchaseValue: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.uid, 
      registrationSource: 'cashier_checkout',
    };

    const result = await db.collection('members').insertOne(newMemberDocument);
    // Fetch the inserted document to get its _id as an ObjectId
    const createdMember = await db.collection('members').findOne({ _id: new ObjectId(result.insertedId) });


    if (createdMember) {
      try {
        const memberPhoneRef = rtdbAdmin.ref(`memberPhoneNumbers/${createdMember.phoneNumber}`);
        await memberPhoneRef.set({
          memberId: createdMember._id.toString(), // Store MongoDB _id as string
          name: createdMember.name,
        });
        console.log(`Synced new member (checkout) ${createdMember.phoneNumber} to RTDB /memberPhoneNumbers`);
      } catch (rtdbError) {
        console.error("RTDB Sync Error (checkout member): Failed to sync new member to RTDB:", rtdbError);
        // Log this error, but don't fail the member creation if MongoDB part succeeded.
      }
      // Return the full member object, including the _id
      return NextResponse.json({ 
          success: true, 
          message: 'Member registered successfully', 
          member: {
            id: createdMember._id.toString(), // send id as string
            name: createdMember.name,
            phoneNumber: createdMember.phoneNumber,
            //... other fields if needed by client immediately
          } 
      }, { status: 201 });
    } else {
      console.error("Failed to retrieve created member from DB immediately after insert.");
      throw new Error("Failed to retrieve created member from DB.");
    }

  } catch (error) {
    console.error("API Error: Failed to register member during checkout:", error);
    if (error.code === 11000) { // MongoDB duplicate key error
      return NextResponse.json({ success: false, message: 'This phone number might have been registered by another process. Please try looking up again.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error.message || 'Failed to register member', errorDetails: error.toString() }, { status: 500 });
  }
});