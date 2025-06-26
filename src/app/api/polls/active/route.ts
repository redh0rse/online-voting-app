import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { dbConnect } from '@/lib/db';
import Poll from '@/models/Poll';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Get current date
    const now = new Date();
    
    // Find active polls where current date is between start and end date
    const polls = await Poll.find({
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ endDate: 1 }); // Sort by end date (soonest ending first)
    
    return NextResponse.json(
      { polls },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error fetching active polls:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 