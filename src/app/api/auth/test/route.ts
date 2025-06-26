import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    // Check if authentication configuration is working
    const session = await getServerSession(authOptions);
    
    // Check environment variables
    const configStatus = {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      MONGODB_URI: !!process.env.MONGODB_URI,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    };
    
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user || null,
      configStatus,
      message: 'Authentication system is working correctly'
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      error: 'Authentication system error',
      message: (error as Error).message
    }, { status: 500 });
  }
} 