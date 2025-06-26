'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

// Registration popup component
const RegistrationPrompt = ({ 
  isOpen, 
  onClose, 
  onRegister 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onRegister: () => void;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-4">Complete Your Registration</h2>
        <p className="text-gray-600 mb-6">
          To access all features of this platform, you need to complete your registration process.
        </p>
        <div className="flex justify-end space-x-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Later
          </button>
          <button
            onClick={onRegister}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Register Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RegistrationCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showPrompt, setShowPrompt] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Paths that don't need registration check
  const excludedPaths = [
    '/register',
    '/login',
    '/api',
    '/auth',
  ];
  
  // Check if current path is excluded
  const isExcludedPath = () => {
    return excludedPaths.some(path => pathname?.startsWith(path));
  };
  
  // Check registration status when session changes
  useEffect(() => {
    const checkRegistration = async () => {
      // Skip if not authenticated or on excluded paths
      if (status !== 'authenticated' || isExcludedPath() || checkingStatus) {
        return;
      }
      
      setCheckingStatus(true);
      
      try {
        const response = await fetch('/api/auth/check-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ provider: 'google' }),
        });
        
        const data = await response.json();
        
        // If registration is incomplete, handle accordingly
        if (response.ok && data.incompleteRegistration) {
          // If already on register page, don't do anything
          if (pathname === '/register') {
            return;
          }
          
          // Show prompt if not on register page
          setShowPrompt(true);
        }
      } catch (error) {
        console.error('Error checking registration status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };
    
    checkRegistration();
  }, [session, status, pathname, checkingStatus]);
  
  // Handle registration prompt actions
  const handleClosePrompt = () => {
    setShowPrompt(false);
  };
  
  const handleRegisterNow = () => {
    setShowPrompt(false);
    router.push('/register');
  };
  
  // Only render the prompt, the rest is just logic
  return <RegistrationPrompt isOpen={showPrompt} onClose={handleClosePrompt} onRegister={handleRegisterNow} />;
} 