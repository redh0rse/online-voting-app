'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface LoadingBarProps {
  color?: string;
  height?: number;
}

export default function LoadingBar({ 
  color = '#3b82f6', // Default blue color
  height = 3 
}: LoadingBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Track navigation changes
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    // When path or search params change, simulate loading
    const startLoading = () => {
      setLoading(true);
      setProgress(0);
      
      // Quickly jump to 30%
      timeout = setTimeout(() => {
        setProgress(30);
        
        // Then to 75% more slowly
        timeout = setTimeout(() => {
          setProgress(75);
          
          // Complete the animation shortly after
          timeout = setTimeout(() => {
            setProgress(100);
            
            // Wait for animation to finish before hiding
            timeout = setTimeout(() => {
              setLoading(false);
              setProgress(0);
            }, 200);
          }, 200);
        }, 300);
      }, 200);
    };
    
    startLoading();
    
    // Clean up timeouts
    return () => {
      clearTimeout(timeout);
    };
  }, [pathname, searchParams]);

  if (!loading && progress === 0) {
    return null;
  }
  
  return (
    <div 
      className="fixed top-0 left-0 z-50 w-full transition-all duration-300" 
      style={{
        height: `${height}px`,
      }}
    >
      <div 
        className="h-full transition-all duration-500 ease-out"
        style={{
          width: `${progress}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
} 