'use client';

// Import face-api with dynamic import for client-side only
import dynamic from 'next/dynamic';
import type * as faceapiType from '@vladmandic/face-api';

// Define a variable to hold the dynamically imported module
let faceapi: typeof faceapiType;

let isModelLoaded = false;

// Load the face-api library dynamically on client-side
const initFaceApi = async (): Promise<typeof faceapiType> => {
  if (typeof window === 'undefined') {
    throw new Error('Face API can only be used in client-side code');
  }
  
  if (!faceapi) {
    faceapi = await import('@vladmandic/face-api');
  }
  
  return faceapi;
};

// Load the required face-api.js models
export async function loadFaceApiModels() {
  if (isModelLoaded) return; // Avoid loading models multiple times
  
  try {
    const api = await initFaceApi();
    
    // The models are loaded from the public directory
    const MODEL_URL = '/models';
    
    // Loading all required models for face detection and recognition
    await Promise.all([
      api.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      api.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    
    isModelLoaded = true;
    console.log('Face API models loaded successfully');
  } catch (error) {
    console.error('Failed to load Face API models:', error);
    throw new Error('Failed to load face recognition models');
  }
}

// Detect faces in an image and return face descriptors (embeddings)
export async function getFaceEmbedding(imageElement: HTMLImageElement | HTMLVideoElement): Promise<Float32Array | null> {
  if (!isModelLoaded) {
    await loadFaceApiModels();
  }
  
  try {
    const api = await initFaceApi();
    
    // Use SSD MobileNet for face detection
    const detections = await api
      .detectSingleFace(imageElement)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detections) {
      throw new Error('No face detected');
    }
    
    return detections.descriptor;
  } catch (error) {
    console.error('Error during face detection:', error);
    return null;
  }
}

// Compare two face embeddings and return similarity score (0-1)
export async function compareFaceEmbeddings(embedding1: Float32Array, embedding2: Float32Array): Promise<number> {
  const api = await initFaceApi();
  return 1 - api.euclideanDistance(embedding1, embedding2);
}

// Verify if the face matches with a stored embedding
export async function verifyFace(
  currentEmbedding: Float32Array,
  storedEmbedding: number[] | Float32Array,
  threshold = 0.6
): Promise<boolean> {
  // Convert stored embedding to Float32Array if it's a regular array
  const storedFloat32Array = 
    storedEmbedding instanceof Float32Array 
      ? storedEmbedding 
      : new Float32Array(storedEmbedding);
  
  const similarity = await compareFaceEmbeddings(currentEmbedding, storedFloat32Array);
  return similarity >= threshold;
} 