import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();
    
    // Get request body
    const data = await request.json();
    const { email, provider } = data;
    
    // If provider is specified but not email, check from session
    if (provider && !email) {
      const session = await getServerSession(authOptions);
      
      // If no session, can't check registration status
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'No email provided and no session found' },
          { status: 400 }
        );
      }
      
      // Use email from session
      const userEmail = session.user.email;
      const user = await User.findOne({ email: userEmail });
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found', message: 'Please register to continue' },
          { status: 404 }
        );
      }
      
      return checkRegistrationStatus(user);
    }
    
    // If specific email provided
    if (email) {
      const user = await User.findOne({ email });
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found', message: 'Please register to continue' },
          { status: 404 }
        );
      }
      
      return checkRegistrationStatus(user);
    }
    
    return NextResponse.json(
      { error: 'No email or provider specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error checking registration status:', error);
    return NextResponse.json(
      { error: 'An error occurred checking registration status' },
      { status: 500 }
    );
  }
}

// Helper function to check registration status
function checkRegistrationStatus(user: any) {
  // Check if registration is incomplete
  if (!user.registrationComplete) {
    // Determine which step the user needs to complete
    let step = 1; // Default to first step
    let currentData = {};
    let message = 'Please complete your registration';
    
    // If email is verified but no personal info
    if (user.email && (!user.name || !user.mobile || !user.voterId || !user.dob)) {
      step = 2;
      message = 'Please complete your personal information';
      // Include any data we have
      currentData = {
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        voterId: user.voterId || '',
        dob: user.dob || '',
      };
    }
    
    // If personal info is complete but no face embedding
    else if (user.name && user.mobile && user.voterId && user.dob && !user.faceEmbedding) {
      step = 3;
      message = 'Please complete face verification';
      currentData = {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        voterId: user.voterId,
        dob: user.dob,
      };
    }
    
    return NextResponse.json({
      incompleteRegistration: {
        step,
        message,
        currentData
      }
    }, { status: 200 });
  }
  
  // Registration is complete
  return NextResponse.json({
    registrationComplete: true
  }, { status: 200 });
} 