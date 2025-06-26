import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Poll from '@/models/Poll';
import Vote from '@/models/Vote';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await dbConnect();

    // Find the poll
    const poll = await Poll.findById(id);

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Get the results by counting votes for each candidate
    const votes = await Vote.aggregate([
      { $match: { pollId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$candidateId', count: { $sum: 1 } } }
    ]);

    // Create a map of candidate ID to vote count
    const resultsMap = new Map();
    votes.forEach((vote) => {
      resultsMap.set(vote._id, vote.count);
    });

    // Format the results with candidate info
    const results = poll.candidates.map((candidate: any) => {
      const candidateId = candidate._id.toString();
      return {
        name: candidate.name,
        party: candidate.party,
        symbol: candidate.symbol,
        votes: resultsMap.get(candidateId) || 0
      };
    });

    const totalVotes = poll.totalVotes;

    return NextResponse.json({
      pollId: poll._id,
      title: poll.title,
      totalVotes,
      results
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching poll results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch poll results' },
      { status: 500 }
    );
  }
} 