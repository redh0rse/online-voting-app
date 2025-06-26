'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FiPlus, FiTrash2, FiAlertCircle, FiLoader } from 'react-icons/fi';

interface Candidate {
  name: string;
  party: string;
  symbol: string;
}

export default function CreatePollPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check if user is admin
  const isAdmin = (session?.user as any)?.role === 'admin';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  const [candidates, setCandidates] = useState<Candidate[]>([
    { name: '', party: '', symbol: '/party-symbols/default.png' },
    { name: '', party: '', symbol: '/party-symbols/default.png' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not admin or not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (status === 'authenticated' && !isAdmin) {
    router.push('/dashboard');
    return null;
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCandidateChange = (index: number, field: keyof Candidate, value: string) => {
    const newCandidates = [...candidates];
    newCandidates[index] = { ...newCandidates[index], [field]: value };
    setCandidates(newCandidates);
  };

  const handleAddCandidate = () => {
    setCandidates([...candidates, { name: '', party: '', symbol: '/party-symbols/default.png' }]);
  };

  const handleRemoveCandidate = (index: number) => {
    if (candidates.length <= 2) {
      setError('A minimum of 2 candidates is required');
      return;
    }
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  // Validate the form
  const validateForm = () => {
    // Check required fields
    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate) {
      setError('Please fill in all poll details');
      return false;
    }

    // Check start and end dates
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Please enter valid dates');
      return false;
    }

    if (start >= end) {
      setError('Start date must be before end date');
      return false;
    }

    // Check candidates
    for (const candidate of candidates) {
      if (!candidate.name || !candidate.party) {
        setError('Please fill in all candidate details');
        return false;
      }
    }

    // Check for duplicate candidate names
    const names = candidates.map((c) => c.name);
    if (new Set(names).size !== names.length) {
      setError('Candidate names must be unique');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          candidates,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create poll');
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating poll:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Poll</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Poll Details</h2>
            <div className="mb-4">
              <label htmlFor="title" className="block mb-1 font-medium">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter poll title"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block mb-1 font-medium">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={4}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter poll description"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label htmlFor="startDate" className="block mb-1 font-medium">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="endDate" className="block mb-1 font-medium">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Candidates</h2>
            {candidates.map((candidate, index) => (
              <div key={index} className="mb-6 p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">Candidate {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => handleRemoveCandidate(index)}
                    className="text-red-600 hover:text-red-800"
                    title="Remove Candidate"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <div className="mb-3">
                  <label className="block mb-1 font-medium">Name</label>
                  <input
                    type="text"
                    value={candidate.name}
                    onChange={(e) => handleCandidateChange(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter candidate name"
                  />
                </div>

                <div className="mb-3">
                  <label className="block mb-1 font-medium">Party</label>
                  <input
                    type="text"
                    value={candidate.party}
                    onChange={(e) => handleCandidateChange(index, 'party', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter party name"
                  />
                </div>

                <div className="mb-1">
                  <label className="block mb-1 font-medium">Party Symbol URL</label>
                  <input
                    type="text"
                    value={candidate.symbol}
                    onChange={(e) => handleCandidateChange(index, 'symbol', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="URL to symbol image"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enter URL to the party symbol image. Default: /party-symbols/default.png
                </p>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddCandidate}
              className="w-full py-2 border border-dashed border-gray-400 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-50"
            >
              <FiPlus className="mr-2" /> Add Another Candidate
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
              <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-between">
            <Link
              href="/dashboard"
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" /> Creating...
                </>
              ) : (
                'Create Poll'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 