'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FiUser, FiCheckCircle, FiList, FiBarChart2 } from 'react-icons/fi';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [activePolls, setActivePolls] = useState<any[]>([]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      // Fetch user data
      const fetchUserData = async () => {
        try {
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const data = await response.json();
            setUserData(data.user);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      // Fetch active polls
      const fetchActivePolls = async () => {
        try {
          const response = await fetch('/api/polls/active');
          if (response.ok) {
            const data = await response.json();
            setActivePolls(data.polls);
          }
        } catch (error) {
          console.error('Error fetching active polls:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
      fetchActivePolls();
    }
  }, [status, session, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to Online Voting</h1>
      
      {/* User info card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center">
          <div className="bg-blue-100 p-3 rounded-full">
            <FiUser className="text-blue-600 text-xl" />
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-semibold">{session?.user?.name || 'User'}</h2>
            <p className="text-gray-600">{session?.user?.email}</p>
          </div>
          {userData?.hasVoted && (
            <div className="ml-auto flex items-center text-green-600">
              <FiCheckCircle className="mr-1" />
              <span>Vote Cast</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick actions */}
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/vote" className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-colors">
          <FiCheckCircle className="text-2xl mb-2" />
          <h3 className="text-lg font-medium mb-1">Cast Your Vote</h3>
          <p className="text-blue-100">Vote in the ongoing elections</p>
        </Link>
        
        <Link href="/polls" className="bg-indigo-600 text-white rounded-lg p-6 hover:bg-indigo-700 transition-colors">
          <FiList className="text-2xl mb-2" />
          <h3 className="text-lg font-medium mb-1">View All Polls</h3>
          <p className="text-indigo-100">See all active and past elections</p>
        </Link>
        
        <Link href="/results" className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition-colors">
          <FiBarChart2 className="text-2xl mb-2" />
          <h3 className="text-lg font-medium mb-1">Election Results</h3>
          <p className="text-purple-100">View results of completed elections</p>
        </Link>
      </div>
      
      {/* Active polls */}
      <h2 className="text-xl font-semibold mb-4">Active Elections</h2>
      {activePolls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activePolls.map((poll) => (
            <div key={poll._id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium mb-2">{poll.title}</h3>
              <p className="text-gray-600 mb-4">{poll.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Ends: {new Date(poll.endDate).toLocaleDateString()}
                </span>
                <Link 
                  href={`/vote/${poll._id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Vote Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No active elections at the moment.</p>
          <p className="text-gray-500 mt-2">Check back later for upcoming polls.</p>
        </div>
      )}
    </div>
  );
} 