'use client';

import { useState, FormEvent, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WebcamCapture from '@/components/WebcamCapture';
import { FiAlertCircle, FiCheck, FiArrowRight } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { signIn, useSession } from 'next-auth/react';

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const initialStep = searchParams.get('step') ? parseInt(searchParams.get('step')!, 10) : 1;
  const [step, setStep] = useState(initialStep);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    dob: '',
    voterId: '',
  });
  const [faceEmbedding, setFaceEmbedding] = useState<Float32Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [faceCaptureError, setFaceCaptureError] = useState('');
  const [googleVerified, setGoogleVerified] = useState(false);
  
  // Check registration status when session changes
  const checkRegistrationStatus = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/check-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.incompleteRegistration) {
        // If registration is incomplete, set to the appropriate step
        const incompleteStep = data.incompleteRegistration.step;
        setStep(incompleteStep);
        
        // Update form data if available
        if (data.incompleteRegistration.currentData) {
          setFormData(prev => ({
            ...prev,
            ...data.incompleteRegistration.currentData,
          }));
        }
      } else if (response.ok && data.registrationComplete) {
        // If registration is complete, redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error checking registration status:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Check URL parameters and session for registration state
  useEffect(() => {
    // Get step from URL if it exists
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const parsedStep = parseInt(stepParam, 10);
      if (!isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 3) {
        setStep(parsedStep);
      }
    }
    
    // If the user is authenticated with Google
    if (status === 'authenticated' && session?.user?.email) {
      setGoogleVerified(true);
      
      // Update form data with session info
      setFormData(prev => ({
        ...prev,
        email: session.user?.email || prev.email,
        name: session.user?.name || prev.name,
      }));
      
      // Check registration status to determine the next step
      checkRegistrationStatus(session.user.email);
    }
  }, [status, session, searchParams, checkRegistrationStatus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFaceCapture = (embedding: Float32Array) => {
    setFaceEmbedding(embedding);
    setFaceCaptureError('');
  };

  const handleFaceError = (errorMessage: string) => {
    setFaceCaptureError(errorMessage);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Use signIn without redirect for SPA approach
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: window.location.href,
      });
      
      if (result?.error) {
        setError('Google authentication failed: ' + result.error);
      }
      
      // Don't need to handle success case here as the useEffect will take care of it
      // when the session changes
    } catch (error) {
      setError('Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    if (!googleVerified) {
      setError('Please verify with Google Authentication first');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.name || !formData.mobile || !formData.dob || !formData.voterId) {
      setError('Please fill in all fields');
      return false;
    }
    
    // Validate Indian mobile number (10 digits starting with 6-9)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(formData.mobile)) {
      setError('Please enter a valid Indian mobile number');
      return false;
    }
    
    // Validate voter ID (example format, adjust as needed)
    if (formData.voterId.length < 10) {
      setError('Please enter a valid Voter ID number');
      return false;
    }
    
    setError('');
    return true;
  };

  const validateStep3 = () => {
    if (!faceEmbedding) {
      setError('Please capture your face for verification');
      return false;
    }
    
    setError('');
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('step', '2');
      window.history.pushState({}, '', url.toString());
    } else if (step === 2 && validateStep2()) {
      // Save personal info to the server
      savePersonalInfo().then(success => {
        if (success) {
          setStep(3);
          // Update URL without page reload
          const url = new URL(window.location.href);
          url.searchParams.set('step', '3');
          window.history.pushState({}, '', url.toString());
        }
      });
    }
  };

  const prevStep = () => {
    const newStep = Math.max(1, step - 1);
    setStep(newStep);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('step', newStep.toString());
    window.history.pushState({}, '', url.toString());
    setError('');
  };

  // Save personal information to the server
  const savePersonalInfo = async (): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          mobile: formData.mobile,
          dob: formData.dob,
          voterId: formData.voterId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save personal information');
      }
      
      setLoading(false);
      return true;
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateStep3()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Convert Float32Array to regular array for JSON serialization
      const faceEmbeddingArray = Array.from(faceEmbedding!);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          faceEmbedding: faceEmbeddingArray,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-2">Register</h1>
      <p className="text-gray-600 text-center mb-8">Create your account to start voting</p>
      
      {/* Progress indicator */}
      <div className="flex mb-8">
        <div className="flex-1">
          <div className={`h-2 rounded-l-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <p className="text-center mt-2 text-sm border-0">Authentication </p>
        </div>
        <div className="flex-1">
          <div className={`h-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <p className="text-center mt-2 text-sm">Personal Info</p>
        </div>
        <div className="flex-1">
          <div className={`h-2 rounded-r-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <p className="text-center mt-2 text-sm">Face Verification</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Step 1: Google Authentication */}
        {step === 1 && (
          <div className="text-center">
            <div className="mb-6">
              <p className="mb-4">
                Please verify your identity using Google Authentication to continue.
              </p>
              
              {googleVerified ? (
                <div className="mt-4 text-green-600 flex items-center justify-center">
                  <FiCheck className="mr-1" size={20} />
                  <span>Google verification successful</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex items-center justify-center w-full py-3 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <FcGoogle className="mr-2" size={20} />
                  <span className='text-black cursor-pointer'>{loading ? 'Verifying...' : 'Verify with Google'}</span>
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Step 2: Personal Information */}
        {step === 2 && (
          <div>
            <div className="mb-4">
              <label htmlFor="name" className="block mb-1 font-medium">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block mb-1 font-medium">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email address"
                readOnly={googleVerified}
                disabled={googleVerified}
              />
              {googleVerified && (
                <p className="text-xs text-gray-500 mt-1">Email verified through Google</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="mobile" className="block mb-1 font-medium">
                Mobile Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                  +91
                </span>
                <input
                  type="text"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your 10-digit mobile number"
                  maxLength={10}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="dob" className="block mb-1 font-medium">
                Date of Birth
              </label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="voterId" className="block mb-1 font-medium">
                Voter ID Number
              </label>
              <input
                type="text"
                id="voterId"
                name="voterId"
                value={formData.voterId}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your voter ID number"
              />
            </div>
          </div>
        )}
        
        {/* Step 3: Face Verification */}
        {step === 3 && (
          <div>
            <div className="mb-6 text-center">
              <p className="mb-4">
                Please look at the camera and capture your face. This will be used for verification when you vote.
              </p>
              
              <WebcamCapture 
                onCapture={handleFaceCapture}
                onError={handleFaceError}
              />
              
              {faceEmbedding && (
                <div className="mt-4 text-green-600 flex items-center justify-center">
                  <FiCheck className="mr-1" />
                  Face captured successfully
                </div>
              )}
              
              {faceCaptureError && (
                <div className="mt-4 text-red-600">
                  <p>{faceCaptureError}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
            <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}
          
          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={loading}
            >
              {loading ? 'Saving...' : (
                <>
                  Next <FiArrowRight className="ml-1" />
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Complete Registration'}
            </button>
          )}
        </div>
      </form>
      
      <div className="mt-8 text-center">
        <p>
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
} 