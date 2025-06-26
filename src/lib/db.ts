import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface GlobalWithMongoose extends globalThis.Global {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI as string;
const MONGODB_LOCAL_URI = 'mongodb://localhost:27017/online-voting';

declare const global: GlobalWithMongoose;

/**
 * Cached connection object
 */
const cached = global.mongoose || { conn: null, promise: null };

/**
 * Connect to MongoDB
 */
export async function dbConnect() {
  // If connection exists, return it
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  // If connection isn't established yet, create a new connection
  if (!cached.promise) {
    const options = {
      bufferCommands: true, // Allow operations to be buffered until connection is established
      serverSelectionTimeoutMS: 10000, // Give up initial connection after 10 seconds
      socketTimeoutMS: 45000, // Close socket after 45 seconds of inactivity
    };

    // Try to connect to the primary URI with error handling
    console.log('Connecting to MongoDB...');
    
    // First try the primary URI
    cached.promise = mongoose
      .connect(MONGODB_URI, options)
      .catch((err) => {
        console.error('MongoDB connection error with primary URI:', err);
        
        // If primary fails, attempt local connection
        console.log('Trying fallback local connection...');
        return mongoose.connect(MONGODB_LOCAL_URI, options);
      })
      .catch((err) => {
        console.error('All MongoDB connection attempts failed:', err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    console.log('MongoDB connected successfully');
    return cached.conn;
  } catch (error) {
    console.error('Error connecting to database:', error);
    // Set our cached promise to null so that subsequent requests will try to reconnect
    cached.promise = null;
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function dbDisconnect() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('MongoDB disconnected');
  }
}

// Set up mongoose options globally
mongoose.set('strictQuery', true); // Strict query mode to catch errors 