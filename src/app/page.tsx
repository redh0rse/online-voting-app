'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiCheckCircle, FiUserCheck, FiShield, FiArrowRight, FiUsers, FiBarChart2, FiLock, FiSmile } from 'react-icons/fi';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState<string>('security');
  
  // Check registration status when session is authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      const checkRegistrationStatus = async () => {
        try {
          const response = await fetch('/api/auth/check-registration', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ provider: 'google' }),
          });
          
          const data = await response.json();
          
          // If registration is incomplete, redirect to registration
          if (response.ok && data.incompleteRegistration) {
            const step = data.incompleteRegistration.step;
            router.push(`/register?step=${step}`);
          } else if (response.ok && data.registrationComplete) {
            // If registration is complete, redirect to dashboard
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error checking registration status:', error);
        }
      };
      
      checkRegistrationStatus();
    }
  }, [status, router]);

  const features = {
    security: {
      title: 'Enhanced Security',
      description: 'Our platform utilizes facial recognition technology to authenticate voters, ensuring only eligible citizens participate and preventing fraud.',
      icon: <FiShield size={48} className="text-blue-600" />,
    },
    accessibility: {
      title: 'Convenient Access',
      description: 'Vote securely from anywhere with internet access, eliminating the need to travel to polling stations and making the voting process more accessible.',
      icon: <FiUsers size={48} className="text-blue-600" />,
    },
    transparency: {
      title: 'Full Transparency',
      description: 'Real-time results and a comprehensive audit trail provide complete transparency, building trust in the democratic process.',
      icon: <FiBarChart2 size={48} className="text-blue-600" />,
    },
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Secure Online Voting with Face Recognition
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              A modern approach to elections with enhanced security and accessibility
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="px-6 py-3 bg-white text-blue-800 font-medium rounded-md hover:bg-gray-100 transition-colors"
              >
                Register to Vote
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black text-center mb-12">Why Choose Online Voting?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-black">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <FiCheckCircle className="text-blue-600 text-xl" />
              </div>
              <h3 className="text-xl  font-semibold mb-2">Convenient & Accessible</h3>
              <p className="text-gray-600">
                Vote from anywhere, anytime. No need to travel to polling stations or wait in long queues.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-black">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <FiLock className="text-blue-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Transparent</h3>
              <p className="text-gray-600">
                Advanced face recognition ensures only eligible voters can cast their vote, preventing fraud.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-black">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <FiSmile className="text-blue-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">User-Friendly</h3>
              <p className="text-gray-600">
                Simple and intuitive interface makes voting easy for everyone, regardless of technical expertise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Register</h3>
              <p className="text-gray-600">
                Create an account using your voter ID and personal details
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Verify Identity</h3>
              <p className="text-gray-600">
                Complete face verification for secure authentication
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Vote</h3>
              <p className="text-gray-600">
                Cast your vote in active elections securely
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl font-bold">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">View Results</h3>
              <p className="text-gray-600">
                Check election results once voting period ends
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link
              href="/register"
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
