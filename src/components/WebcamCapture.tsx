'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { FiCamera, FiRefreshCw } from 'react-icons/fi';
import { getFaceEmbedding } from '@/services/faceClient';

interface WebcamCaptureProps {
  onCapture: (embedding: Float32Array) => void;
  onError: (message: string) => void;
}

export default function WebcamCapture({ onCapture, onError }: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // Handle camera errors
  const handleCameraError = useCallback(() => {
    setCameraError(true);
    onError('Unable to access camera. Please ensure you have given permission to use your camera.');
  }, [onError]);

  // Capture image from webcam
  const capture = useCallback(async () => {
    setIsCapturing(true);
    
    try {
      const webcam = webcamRef.current;
      
      if (!webcam) {
        throw new Error('Webcam not initialized');
      }
      
      // Capture image
      const imageSrc = webcam.getScreenshot();
      
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }
      
      setImgSrc(imageSrc);
      
      // Process the captured image to get face embedding
      const img = new Image();
      img.src = imageSrc;
      
      // Wait for image to load
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Get face embedding
      const embedding = await getFaceEmbedding(img);
      
      if (!embedding) {
        throw new Error('No face detected. Please ensure your face is clearly visible and try again.');
      }
      
      // Pass embedding to parent component
      onCapture(embedding);
      
    } catch (error) {
      console.error('Face capture error:', error);
      onError((error as Error).message);
    } finally {
      setIsCapturing(false);
    }
  }, [webcamRef, onCapture, onError]);

  // Reset the captured image
  const reset = useCallback(() => {
    setImgSrc(null);
    onError('');
  }, [onError]);

  return (
    <div className="flex flex-col items-center">
      {cameraError ? (
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
          <p>Camera access error. Please check your camera permissions and refresh the page.</p>
        </div>
      ) : imgSrc ? (
        <div className="relative">
          <img 
            src={imgSrc} 
            alt="Captured" 
            className="rounded-lg max-w-full h-auto border border-gray-300"
          />
          <button
            onClick={reset}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center justify-center"
          >
            <FiRefreshCw className="mr-2" />
            Retake
          </button>
        </div>
      ) : (
        <div className="relative">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 320,
              height: 240,
              facingMode: "user"
            }}
            onUserMediaError={handleCameraError}
            className="rounded-lg border border-gray-300"
          />
          <button
            onClick={capture}
            disabled={isCapturing}
            className={`mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center ${
              isCapturing ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <FiCamera className="mr-2" />
            {isCapturing ? 'Processing...' : 'Capture Photo'}
          </button>
        </div>
      )}
    </div>
  );
} 