import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const email = session.user.email;
    const data = await request.json();
    
    // Connect to database
    await dbConnect();
    
    // Find the user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Determine what data we're updating
    
    // Step 1: Email is already verified from Google auth
    
    // Step 2: Personal information update
    if (data.name && data.mobile && data.dob && data.voterId) {
      user.name = data.name;
      user.mobile = data.mobile;
      user.dob = data.dob;
      user.voterId = data.voterId;
      
      // If there's any duplicate voter ID, reject the request
      const existingUserWithVoterId = await User.findOne({ 
        voterId: data.voterId, 
        _id: { $ne: user._id } // Exclude the current user
      });
      
      if (existingUserWithVoterId) {
        return NextResponse.json(
          { error: 'Voter ID already registered with another account' },
          { status: 400 }
        );
      }
    }
    
    // Step 3: Face embedding update
    if (data.faceEmbedding && Array.isArray(data.faceEmbedding)) {
      user.faceEmbedding = data.faceEmbedding;
      
      // If we have face embedding, personal info, and email, mark registration as complete
      if (user.name && user.email && user.mobile && user.dob && user.voterId) {
        user.registrationComplete = true;
      }
    }
    
    // Save the user
    await user.save();
    
    return NextResponse.json({
      success: true,
      registrationComplete: user.registrationComplete,
      currentStep: user.registrationComplete ? 'complete' : 
                   user.faceEmbedding ? 'complete' :
                   user.name && user.mobile && user.dob && user.voterId ? 3 : 2
    }, { status: 200 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to process registration update' },
      { status: 500 }
    );
  }
} 