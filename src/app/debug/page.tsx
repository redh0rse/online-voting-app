'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [authTest, setAuthTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuthTest() {
      try {
        const res = await fetch('/api/auth/test');
        const data = await res.json();
        setAuthTest(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchAuthTest();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug Page</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Client-side Session Status</h2>
        <p><strong>Status:</strong> {status}</p>
        {session ? (
          <div className="mt-3">
            <p><strong>User:</strong> {session.user?.name} ({session.user?.email})</p>
            <p><strong>Role:</strong> {session.user?.role || 'Not set'}</p>
            <p><strong>Voter ID:</strong> {session.user?.voterId || 'Not set'}</p>
            <pre className="mt-3 bg-gray-200 p-3 rounded overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="mt-3 text-yellow-600">No active session</p>
        )}
      </div>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Server-side Authentication Test</h2>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">Error: {error}</p>
        ) : (
          <div>
            <p><strong>Authenticated:</strong> {authTest.authenticated ? 'Yes' : 'No'}</p>
            <h3 className="font-semibold mt-3">Environment Variables:</h3>
            <ul className="list-disc ml-6 mt-2">
              {Object.entries(authTest.configStatus).map(([key, value]) => (
                <li key={key}>
                  {key}: <span className={value ? 'text-green-600' : 'text-red-600'}>{value ? 'Set' : 'Missing'}</span>
                </li>
              ))}
            </ul>
            {authTest.user && (
              <div className="mt-3">
                <h3 className="font-semibold">User:</h3>
                <pre className="mt-2 bg-gray-200 p-3 rounded overflow-auto">
                  {JSON.stringify(authTest.user, null, 2)}
                </pre>
              </div>
            )}
            <div className="mt-3">
              <h3 className="font-semibold">Full Response:</h3>
              <pre className="mt-2 bg-gray-200 p-3 rounded overflow-auto">
                {JSON.stringify(authTest, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-blue-50 text-blue-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Debugging Tips</h2>
        <ul className="list-disc ml-6">
          <li>Make sure all required environment variables are set in .env.local</li>
          <li>Check that your Google OAuth credentials are correct</li>
          <li>Verify that the redirect URIs in Google Console include your NEXTAUTH_URL</li>
          <li>If you're experiencing redirect loops, try clearing cookies and browser cache</li>
        </ul>
      </div>
    </div>
  );
} 