import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { dbConnect } from '@/lib/db';
import Poll from '@/models/Poll';
import Vote from '@/models/Vote';
import User from '@/models/User';
import { verifyFace } from '@/services/faceClient';
import { emitToRoom } from '@/app/api/socket/route';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: pollId } = await params;

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to vote' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { candidateId, faceEmbedding } = body;

    // Validate required fields
    if (!candidateId) {
      return NextResponse.json(
        { error: 'Missing candidate ID' },
        { status: 400 }
      );
    }

    if (!faceEmbedding) {
      return NextResponse.json(
        { error: 'Face verification required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get the user data including stored face embedding
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has already voted
    if (user.hasVoted) {
      return NextResponse.json(
        { error: 'You have already voted in this election' },
        { status: 400 }
      );
    }

    // Check if the poll exists and is active
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    if (!poll.isActive) {
      return NextResponse.json(
        { error: 'This poll is not active' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now < poll.startDate || now > poll.endDate) {
      return NextResponse.json(
        { error: 'This poll is not currently open for voting' },
        { status: 400 }
      );
    }

    // Validate that the candidate exists in this poll
    // We need to use the raw document to access the MongoDB _id
    const pollDoc = poll.toObject();
    const candidateExists = pollDoc.candidates.some(
      (candidate: any) => candidate._id.toString() === candidateId
    );
    
    if (!candidateExists) {
      return NextResponse.json(
        { error: 'Invalid candidate for this poll' },
        { status: 400 }
      );
    }

    // Verify the face embedding with the stored embedding
    const currentEmbedding = new Float32Array(faceEmbedding);
    const storedEmbedding = user.faceEmbedding;
    
    // Check if user has a stored face embedding
    if (!storedEmbedding || storedEmbedding.length === 0) {
      return NextResponse.json(
        { error: 'No face data found for this user. Please complete registration first.' },
        { status: 400 }
      );
    }
    
    const isVerified = await verifyFace(currentEmbedding, storedEmbedding, 0.6);
    
    if (!isVerified) {
      return NextResponse.json(
        { error: 'Face verification failed' },
        { status: 400 }
      );
    }

    // Create the vote record
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    const vote = await Vote.create({
      pollId: new mongoose.Types.ObjectId(pollId),
      userId: new mongoose.Types.ObjectId(userId),
      candidateId,
      ipAddress,
      deviceInfo: userAgent,
      timestamp: new Date(),
    });

    // Update the poll total votes and mark the user as having voted
    await Poll.findByIdAndUpdate(pollId, { $inc: { totalVotes: 1 } });
    await User.findByIdAndUpdate(userId, { hasVoted: true });

    // Emit the vote to connected clients via Socket.io
    emitToRoom(`poll:${pollId}`, 'vote_cast', { pollId, candidateId });

    return NextResponse.json(
      { message: 'Vote successfully recorded' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
} 