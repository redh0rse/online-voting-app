'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import WebcamCapture from '@/components/WebcamCapture';
import CandidateCard from '@/components/CandidateCard';
import { FiAlertCircle, FiCheck, FiLoader } from 'react-icons/fi';

interface Candidate {
  _id: string;
  name: string;
  party: string;
  symbol: string;
}

interface Poll {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  candidates: Candidate[];
  isActive: boolean;
}

export default function VotingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [step, setStep] = useState(1); // 1: candidate selection, 2: face verification, 3: confirmation
  const [faceEmbedding, setFaceEmbedding] = useState<Float32Array | null>(null);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication and load poll data
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchPoll();
    }
  }, [status, params.id, router]);

  // Fetch poll details
  const fetchPoll = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/polls/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch poll details');
      }

      setPoll(data.poll);

      // Check if the poll is active
      const now = new Date();
      const startDate = new Date(data.poll.startDate);
      const endDate = new Date(data.poll.endDate);
      
      if (now < startDate) {
        throw new Error('This poll has not started yet');
      }
      
      if (now > endDate || !data.poll.isActive) {
        throw new Error('This poll has ended');
      }

      // Check if the user has already voted
      if ((session?.user as any)?.hasVoted) {
        throw new Error('You have already cast your vote');
      }

    } catch (error) {
      console.error('Error:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Handle candidate selection
  const handleCandidateSelect = (id: string) => {
    setSelectedCandidate(id);
  };

  // Handle face capture
  const handleFaceCapture = (embedding: Float32Array) => {
    setFaceEmbedding(embedding);
    setVerificationMessage('Face captured successfully!');
  };

  // Handle face error
  const handleFaceError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Move to face verification step
  const handleProceedToVerification = () => {
    if (!selectedCandidate) {
      setError('Please select a candidate to vote for');
      return;
    }
    setStep(2);
    setError('');
  };

  // Move to confirmation step
  const handleProceedToConfirmation = () => {
    if (!faceEmbedding) {
      setError('Face verification is required');
      return;
    }
    setStep(3);
    setError('');
  };

  // Go back to previous step
  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  // Submit the vote
  const handleSubmitVote = async () => {
    if (!selectedCandidate || !faceEmbedding || !poll) {
      setError('Missing required information');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Convert Float32Array to regular array for JSON serialization
      const faceEmbeddingArray = Array.from(faceEmbedding);

      const response = await fetch(`/api/polls/${params.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: selectedCandidate,
          faceEmbedding: faceEmbeddingArray,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit vote');
      }

      // Redirect to results page on success
      router.push(`/poll/${params.id}/results?voted=true`);
    } catch (error) {
      console.error('Error submitting vote:', error);
      setError((error as Error).message);
      setStep(2); // Go back to face verification on error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date to local format
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-start mb-6">
            <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">Poll not found or no longer available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress steps */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex mb-4">
          <div className="flex-1">
            <div className={`h-2 rounded-l-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <p className="text-center mt-2 text-sm">Select Candidate</p>
          </div>
          <div className="flex-1">
            <div className={`h-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <p className="text-center mt-2 text-sm">Face Verification</p>
          </div>
          <div className="flex-1">
            <div className={`h-2 rounded-r-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <p className="text-center mt-2 text-sm">Confirm Vote</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2">{poll.title}</h1>
        <p className="text-gray-600 mb-4">{poll.description}</p>
        <div className="text-sm text-gray-500 mb-6">
          Voting Period: {formatDate(poll.startDate)} - {formatDate(poll.endDate)}
        </div>

        {/* Step 1: Select candidate */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Your Candidate</h2>
            <div className="grid grid-cols-1 gap-4 mb-6">
              {poll.candidates.map((candidate) => (
                <CandidateCard
                  key={candidate._id}
                  id={candidate._id}
                  name={candidate.name}
                  party={candidate.party}
                  symbol={candidate.symbol}
                  selected={selectedCandidate === candidate._id}
                  onSelect={handleCandidateSelect}
                />
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-start mb-4">
                <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleProceedToVerification}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
              >
                Continue to Verification
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Face verification */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Verify Your Identity</h2>
            <p className="mb-4">
              To ensure the integrity of the voting process, please verify your identity by looking at the camera.
            </p>

            <WebcamCapture
              onCapture={handleFaceCapture}
              onError={handleFaceError}
            />

            {verificationMessage && faceEmbedding && (
              <div className="mt-4 bg-green-50 p-3 rounded-md flex items-center text-green-700">
                <FiCheck className="mr-2" />
                <span>{verificationMessage}</span>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
                <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={handleBack}
                className="border border-gray-300 py-2 px-6 rounded-md hover:bg-gray-50"
              >
                Back
              </button>

              <button
                onClick={handleProceedToConfirmation}
                disabled={!faceEmbedding}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                Continue to Confirmation
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Confirm Your Vote</h2>
            <p className="mb-6">
              Please review your selection before submitting your vote. This action cannot be undone.
            </p>

            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <p className="font-medium mb-2">You are voting for:</p>
              {poll.candidates.map(
                (candidate) =>
                  candidate._id === selectedCandidate && (
                    <CandidateCard
                      key={candidate._id}
                      id={candidate._id}
                      name={candidate.name}
                      party={candidate.party}
                      symbol={candidate.symbol}
                      selected={true}
                    />
                  )
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <p className="text-blue-700">
                <strong>Important:</strong> By clicking "Submit Vote" below, you confirm that:
              </p>
              <ul className="list-disc list-inside text-blue-700 mt-2">
                <li>You are the registered voter</li>
                <li>You understand that your vote cannot be changed once submitted</li>
                <li>You are casting this vote of your own free will</li>
              </ul>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-start mb-4">
                <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="border border-gray-300 py-2 px-6 rounded-md hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Back
              </button>

              <button
                onClick={handleSubmitVote}
                disabled={isSubmitting}
                className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">
                      <FiLoader />
                    </span>
                    Processing...
                  </>
                ) : (
                  'Submit Vote'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 