'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { FiMenu, FiX, FiUser, FiLogOut, FiHome, FiCheckSquare, FiBarChart2 } from 'react-icons/fi';
import Image from 'next/image';

// Extend Session User type
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const user = session?.user as ExtendedUser | undefined;
  const isAdmin = user?.role === 'admin';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  // On registration page but already authenticated
  const isRegistering = pathname === '/register' && status === 'authenticated';

  // Reset image error state when user changes
  useEffect(() => {
    if (user?.image) {
      setImageError(false);
    }
  }, [user?.image]);

  // Handle image loading error
  const handleImageError = () => {
    setImageError(true);
  };

  // Render user avatar - either image or fallback
  const UserAvatar = ({ size = 8, className = '' }: { size?: number, className?: string }) => {
    if (user?.image && !imageError) {
      return (
        <div className={`h-${size} w-${size} rounded-full overflow-hidden border-2 border-gray-200 relative ${className}`}>
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={size * 4} // Multiply by 4 for better quality
            height={size * 4}
            className="h-full w-full object-cover"
            onError={handleImageError}
            unoptimized // Use this to bypass Next.js image optimization for external URLs
          />
        </div>
      );
    }
    
    return (
      <div className={`h-${size} w-${size} rounded-full bg-blue-500 flex items-center justify-center text-white ${className}`}>
        {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
      </div>
    );
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <img
                className="h-8 w-auto"
                src="/voting-illustration.svg"
                alt="Online Voting"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">Online Voting</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <nav className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Home
            </Link>
            
            {status === 'authenticated' ? (
              <>
                {!isRegistering && (
                  <>
                    <Link
                      href="/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard') 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/vote"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/vote') 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Vote
                    </Link>
                    <Link
                      href="/results"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/results') 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Results
                    </Link>
                  </>
                )}

                {/* User profile dropdown */}
                <div className="relative ml-3">
                  <div className="flex items-center">
                    <button
                      onClick={toggleProfile}
                      className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <UserAvatar />
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 top-10">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b">
                          <p className="font-medium">{user?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/register') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Login
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            {status === 'authenticated' && (
              <UserAvatar className="mr-2" />
            )}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              onClick={closeMenu}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <FiHome className="mr-2" />
                Home
              </div>
            </Link>
            
            {status === 'authenticated' ? (
              <>
                {!isRegistering && (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={closeMenu}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        isActive('/dashboard') 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <FiUser className="mr-2" />
                        Dashboard
                      </div>
                    </Link>
                    <Link
                      href="/vote"
                      onClick={closeMenu}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        isActive('/vote') 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <FiCheckSquare className="mr-2" />
                        Vote
                      </div>
                    </Link>
                    <Link
                      href="/results"
                      onClick={closeMenu}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        isActive('/results') 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <FiBarChart2 className="mr-2" />
                        Results
                      </div>
                    </Link>
                  </>
                )}
                <div className="px-3 py-2 border-t border-gray-200 mt-2 pt-2">
                  <div className="flex items-center mb-2">
                    <UserAvatar className="mr-2" />
                    <div>
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    closeMenu();
                    handleSignOut();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <FiLogOut className="mr-2" />
                    Sign Out
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/register') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 