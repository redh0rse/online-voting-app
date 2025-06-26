import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      voterId: string;
      hasVoted: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "user" | "admin";
    voterId: string;
    hasVoted: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "user" | "admin";
    voterId: string;
    hasVoted: boolean;
  }
} 