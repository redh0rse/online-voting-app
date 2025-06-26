import NextAuth from 'next-auth';
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { dbConnect } from '@/lib/db';
import User, { IUser } from '@/models/User';
import mongoose from 'mongoose';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
    // Don't set a specific callback URL, let the client handle it
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider !== 'google') {
          return false; // Only allow Google authentication
        }
        
        await dbConnect();
        
        const existingUser = await User.findOne({ email: user.email })
          .catch(err => {
            console.error("Error finding user during sign in:", err);
            return null;
          });
        
        // If user doesn't exist, create one with initial fields from Google
        if (!existingUser) {
          const newUser = new User({
            email: user.email,
            name: user.name,
            image: user.image,
            emailVerified: new Date(),
          });
          
          await newUser.save()
            .catch(err => {
              console.error("Error creating new user:", err);
              // Allow sign-in even if we couldn't save the user
              // They'll be redirected to complete registration
            });
        }
        
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return true; // Still allow sign-in and handle issues in client side
      }
    },
    
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        try {
          await dbConnect();
          // Use Document from mongoose types for proper typing
          const userDoc = await User.findOne({ email: session.user.email });
          
          if (userDoc) {
            // Use a typed local variable
            const user = userDoc.toObject() as IUser & { _id: mongoose.Types.ObjectId };
            
            // Add user data to session
            session.user.id = user._id.toString();
            session.user.role = user.role;
            
            // Add a flag to indicate if registration is complete
            // @ts-ignore - Custom property
            session.user.registrationComplete = user.registrationComplete;
          }
        } catch (error) {
          console.error('Error getting user data for session:', error);
        }
      }
      
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 