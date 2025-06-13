// File: app/api/admin/sales/transactions/route.js

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAdminAuth } from '@/utils/apiAuth';

export const GET = withAdminAuth(async function GET(request, { user }) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '10', 10); // Default to 10 items per page

    let query = {};
    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      query.transactionDate = { $gte: start, $lte: end };
    } else if (startDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      query.transactionDate = { $gte: start };
    } else if (endDateParam) {
        const end = new Date(endDateParam);
        end.setHours(23, 59, 59, 999);
        query.transactionDate = { $lte: end };
    }


    const skip = (pageParam - 1) * limitParam;

    const transactions = await db
      .collection('salesTransactions')
      .find(query)
      .sort({ transactionDate: -1 }) // Latest first
      .skip(skip)
      .limit(limitParam)
      .toArray();

    const totalTransactions = await db.collection('salesTransactions').countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / limitParam);

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        currentPage: pageParam,
        totalPages,
        totalTransactions,
        limit: limitParam,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch sales transactions:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch sales transactions', error: error.message }, { status: 500 });
  }
});