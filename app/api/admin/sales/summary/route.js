// File: app/api/admin/sales/summary/route.js

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAdminAuth } from '@/utils/apiAuth'; // Using your existing admin auth HOC

export const GET = withAdminAuth(async function GET(request, { user }) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // --- Build Match Query for the overall summary ---
    let matchQuery = {};
    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0); // Start of the day
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999); // End of the day
      matchQuery.transactionDate = { $gte: start, $lte: end };
    }

    // --- Build Match Query for the daily breakdown (default to last 30 days) ---
    let dailySummaryStartDate = new Date();
    dailySummaryStartDate.setDate(dailySummaryStartDate.getDate() - 29);
    dailySummaryStartDate.setHours(0, 0, 0, 0);

    let dailySummaryEndDate = new Date();
    dailySummaryEndDate.setHours(23, 59, 59, 999);

    if (startDateParam) {
        dailySummaryStartDate = new Date(startDateParam);
        dailySummaryStartDate.setHours(0,0,0,0);
    }
    if (endDateParam) {
        dailySummaryEndDate = new Date(endDateParam);
        dailySummaryEndDate.setHours(23,59,59,999);
    }
    
    const dailyMatchQuery = {
      transactionDate: {
        $gte: dailySummaryStartDate,
        $lte: dailySummaryEndDate
      }
    };


    // --- Aggregation Pipeline for Overall Summary ---
    const summaryPipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalTransactions: { $sum: 1 },
          totalItemsSold: { $sum: { $sum: '$items.quantitySold' } }
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: { $ifNull: ['$totalRevenue', 0] },
          totalTransactions: { $ifNull: ['$totalTransactions', 0] },
          averageOrderValue: {
            $cond: {
              if: { $gt: ['$totalTransactions', 0] },
              then: { $divide: ['$totalRevenue', '$totalTransactions'] },
              else: 0,
            },
          },
          totalItemsSold: { $ifNull: ['$totalItemsSold', 0] },
        },
      },
    ];

    // --- Aggregation Pipeline for Daily Sales Chart ---
    const dailySalesPipeline = [
      { $match: dailyMatchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' },
          },
          totalRevenue: { $sum: '$grandTotal' },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalRevenue: '$totalRevenue',
          transactionCount: '$transactionCount'
        }
      },
      { $sort: { date: 1 } }, // Sort by date ascending
    ];

    const [summaryResult] = await db.collection('salesTransactions').aggregate(summaryPipeline).toArray();
    const dailySalesResult = await db.collection('salesTransactions').aggregate(dailySalesPipeline).toArray();

    const summary = summaryResult || { // Default if no transactions match
      totalRevenue: 0,
      totalTransactions: 0,
      averageOrderValue: 0,
      totalItemsSold: 0,
    };

    return NextResponse.json({ 
      success: true, 
      summary, 
      dailySales: dailySalesResult 
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch sales summary:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch sales summary', error: error.message }, { status: 500 });
  }
});