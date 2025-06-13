// File: app/api/admin/sales/summary/route.js

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAdminAuth } from '@/utils/apiAuth';

export const GET = withAdminAuth(async function GET(request, { user }) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let matchQuery = {};
    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0); // Start of the day
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999); // End of the day
      matchQuery.transactionDate = { $gte: start, $lte: end };
    } else if (startDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      matchQuery.transactionDate = { $gte: start };
    } else if (endDateParam) {
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      matchQuery.transactionDate = { $lte: end };
    }

    // Default to last 30 days if no dates are provided for daily summary
    // For overall summary, it will be all time if no dates
    let dailySummaryStartDate = new Date();
    if (startDateParam) {
        dailySummaryStartDate = new Date(startDateParam);
        dailySummaryStartDate.setHours(0,0,0,0);
    } else {
       dailySummaryStartDate.setDate(dailySummaryStartDate.getDate() - 29); // Last 30 days including today
       dailySummaryStartDate.setHours(0,0,0,0);
    }
   
    let dailySummaryEndDate = new Date();
    if (endDateParam) {
        dailySummaryEndDate = new Date(endDateParam);
        dailySummaryEndDate.setHours(23,59,59,999);
    } else {
        dailySummaryEndDate.setHours(23,59,59,999); // End of today
    }


    const dailyMatchQuery = {
        transactionDate: {
            $gte: dailySummaryStartDate,
            $lte: dailySummaryEndDate
        }
    };
    
    // Aggregation for overall summary
    const summaryPipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalTransactions: { $sum: 1 },
          // Add more summary fields if needed, e.g., total items sold
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

    // Aggregation for daily sales summary (for charts)
    const dailySalesPipeline = [
      { $match: dailyMatchQuery }, // Use the specific date range for daily breakdown
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' },
          },
          dailyRevenue: { $sum: '$grandTotal' },
          dailyTransactions: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalRevenue: '$dailyRevenue',
          transactionCount: '$dailyTransactions'
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