'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import PollChart from '@/components/PollChart';
import { subscribeToResults } from '@/lib/socket';
import { FiAlertCircle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';

interface CandidateResult {
  name: string;
  party: string;
  symbol: string;
  votes: number;
}

interface PollResult {
  pollId: string;
  title: string;
  totalVotes: number;
  results: CandidateResult[];
}

export default function ResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasJustVoted = searchParams.get('voted') === 'true';
  const { status } = useSession();
  
  const [pollResults, setPollResults] = useState<PollResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch results on component mount
  useEffect(() => {
    if (status !== 'loading') {
      fetchResults();
    }
    
    // Set up socket subscription for real-time results
    const unsubscribe = subscribeToResults(params.id, handleResultsUpdate);
    
    return () => {
      unsubscribe();
    };
  }, [status, params.id]);

  // Fetch poll results from the API
  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/polls/${params.id}/results`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch poll results');
      }

      setPollResults(data);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Handle real-time results update
  const handleResultsUpdate = (data: any) => {
    if (data && data.pollId === params.id) {
      setPollResults((prev) => {
        if (!prev) return null;
        
        // Update the vote count for the specific candidate
        const updatedResults = prev.results.map((candidate) => {
          if (candidate.name === data.candidateName) {
            return { ...candidate, votes: candidate.votes + 1 };
          }
          return candidate;
        });
        
        return {
          ...prev,
          totalVotes: prev.totalVotes + 1,
          results: updatedResults,
        };
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Just voted message */}
        {hasJustVoted && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex items-start">
            <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Your vote has been successfully recorded!</p>
              <p className="text-sm mt-1">
                Thank you for participating in the democratic process.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Poll Results</h1>
            <button
              onClick={fetchResults}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>

          {error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-start">
              <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : !pollResults ? (
            <p className="text-gray-600">No results available for this poll.</p>
          ) : (
            <PollChart
              results={pollResults.results}
              title={pollResults.title}
              totalVotes={pollResults.totalVotes}
            />
          )}
        </div>

        <div className="flex justify-center">
          <Link
            href="/dashboard"
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 