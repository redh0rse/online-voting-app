import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Check if the request is from localhost for security
  const host = req.headers.get('host') || '';
  if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
    return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
  }

  // Check environment variables
  const envStatus = {
    NEXTAUTH_URL: {
      exists: !!process.env.NEXTAUTH_URL,
      value: process.env.NEXTAUTH_URL ? maskValue(process.env.NEXTAUTH_URL) : null,
      valid: !!process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith('http'),
    },
    NEXTAUTH_SECRET: {
      exists: !!process.env.NEXTAUTH_SECRET,
      value: process.env.NEXTAUTH_SECRET ? '✓ Set (masked)' : null,
      valid: !!process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32,
    },
    MONGODB_URI: {
      exists: !!process.env.MONGODB_URI,
      value: process.env.MONGODB_URI ? maskValue(process.env.MONGODB_URI) : null,
      valid: !!process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb'),
    },
    GOOGLE_CLIENT_ID: {
      exists: !!process.env.GOOGLE_CLIENT_ID,
      value: process.env.GOOGLE_CLIENT_ID ? maskValue(process.env.GOOGLE_CLIENT_ID) : null,
      valid: !!process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com'),
    },
    GOOGLE_CLIENT_SECRET: {
      exists: !!process.env.GOOGLE_CLIENT_SECRET,
      value: process.env.GOOGLE_CLIENT_SECRET ? '✓ Set (masked)' : null,
      valid: !!process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET.length > 5,
    },
    NEXT_PUBLIC_SOCKET_URL: {
      exists: !!process.env.NEXT_PUBLIC_SOCKET_URL,
      value: process.env.NEXT_PUBLIC_SOCKET_URL ? maskValue(process.env.NEXT_PUBLIC_SOCKET_URL) : null,
      valid: !!process.env.NEXT_PUBLIC_SOCKET_URL && process.env.NEXT_PUBLIC_SOCKET_URL.startsWith('http'),
    },
    NODE_ENV: {
      exists: !!process.env.NODE_ENV,
      value: process.env.NODE_ENV || null,
      valid: true,
    },
  };

  // Check for overall validity
  const allValid = Object.values(envStatus).every(status => status.valid);
  const missingVars = Object.entries(envStatus)
    .filter(([_, status]) => !status.exists)
    .map(([name]) => name);

  return NextResponse.json({
    status: allValid ? 'ok' : 'error',
    message: allValid 
      ? 'All environment variables are set correctly' 
      : `Some environment variables are missing or invalid: ${missingVars.join(', ')}`,
    envStatus,
    nodeVersion: process.version,
    platform: process.platform,
  });
}

// Helper to mask sensitive values
function maskValue(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '****';
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
} 