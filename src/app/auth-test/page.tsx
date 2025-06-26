'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';

export default function AuthTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Use the most direct approach
      window.location.href = '/api/auth/signin/google?callbackUrl=/dashboard';
    } catch (error) {
      setError('Failed to redirect to Google sign-in');
      console.error(error);
      setLoading(false);
    }
  };

  const handleDirectSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: false
      });
      
      if (result?.error) {
        setError(result.error);
      } else if (result?.url) {
        setSuccess('Redirecting to Google...');
        window.location.href = result.url;
      }
    } catch (error) {
      setError('Failed to initiate Google sign-in');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Test</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
          <p>{success}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Method 1: Direct URL</h2>
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            <FcGoogle size={20} />
            <span>Sign in with Google (Direct URL)</span>
          </button>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Method 2: NextAuth signIn</h2>
          <button
            onClick={handleDirectSignIn}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            <FcGoogle size={20} />
            <span>Sign in with Google (NextAuth)</span>
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-md">
          <h3 className="font-semibold mb-2">Troubleshooting Tips</h3>
          <ul className="list-disc ml-5 space-y-1">
            <li>Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env.local</li>
            <li>Verify that your Google OAuth credentials have the correct redirect URI: <code>{typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback/google` : ''}</code></li>
            <li>Check that NEXTAUTH_URL is set to <code>{typeof window !== 'undefined' ? window.location.origin : ''}</code></li>
            <li>Try clearing your browser cookies and cache</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 