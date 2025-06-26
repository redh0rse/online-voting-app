'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, data: session } = useSession();
  const isRegistered = searchParams.get('registered') === 'true';
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');
  
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [incompleteRegistration, setIncompleteRegistration] = useState<{step: number, message: string} | null>(null);
  
  // Check registration status when authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      const checkRegistrationStatus = async () => {
        try {
          const response = await fetch('/api/auth/check-registration', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: session.user.email }),
          });
          
          const data = await response.json();
          
          if (response.ok) {
            if (data.incompleteRegistration) {
              // Redirect to appropriate registration step
              router.push(`/register?step=${data.incompleteRegistration.step}`);
            } else if (data.registrationComplete) {
              // Redirect to dashboard if registration is complete
              router.push('/dashboard');
            }
          }
        } catch (error) {
          console.error('Error checking registration status:', error);
        }
      };
      
      checkRegistrationStatus();
    }
  }, [status, session, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError('');
    
    try {
      // First check if the user exists in the database
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: window.location.origin
      });
      
      if (result?.error) {
        setAuthError(result.error === 'AccessDenied' 
          ? 'Registration not complete. Please complete your registration first.'
          : result.error);
      }
      // Don't redirect here - let the useEffect handle it
    } catch (error) {
      console.error('Google sign-in error:', error);
      setAuthError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCompleteRegistration = () => {
    if (incompleteRegistration) {
      router.push(`/register?step=${incompleteRegistration.step}`);
    } else {
      router.push('/register');
    }
  };
  
  // If already authenticated, the useEffect will handle redirection
  // Just show loading state while checking
  if (status === 'authenticated') {
    return (
      <div className="max-w-md mx-auto py-8 text-center">
        <p className="text-gray-600">Checking your registration status...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-2">Login</h1>
      <p className="text-gray-600 text-center mb-8">Sign in to access your voting account</p>
      
      {/* Registration success message */}
      {isRegistered && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex items-start">
          <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Registration successful!</p>
            <p className="text-sm mt-1">You can now log in with your credentials.</p>
          </div>
        </div>
      )}
      
      {/* Error message from URL */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Login error</p>
            <p className="text-sm mt-1">
              {error === 'AccessDenied' 
                ? 'Authentication failed. Please complete your registration first.' 
                : `Error: ${error}`
              }
            </p>
            <Link href="/register" className="mt-2 inline-block px-4 py-1 bg-red-100 hover:bg-red-200 rounded-md text-sm">
              Go to Registration
            </Link>
          </div>
        </div>
      )}

      {/* Error message from state */}
      {authError && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Login error</p>
            <p className="text-sm mt-1">{authError}</p>
            <button
              onClick={handleCompleteRegistration}
              className="mt-2 px-4 py-1 bg-red-100 hover:bg-red-200 rounded-md text-sm"
            >
              Complete Registration
            </button>
          </div>
        </div>
      )}
      
      {/* Incomplete registration message */}
      {incompleteRegistration && (
        <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-md">
          <p className="font-medium">Registration incomplete</p>
          <p className="text-sm mt-1">{incompleteRegistration.message}</p>
          <button 
            onClick={handleCompleteRegistration}
            className="mt-2 px-4 py-1 bg-yellow-100 hover:bg-yellow-200 rounded-md text-sm"
          >
            Complete Registration
          </button>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* Google Sign-in Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-6 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          <FcGoogle size={20} />
          <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
        </button>
      </div>
      
      <div className="mt-8 text-center">
        <p>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
} 