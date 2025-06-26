import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/lib/provider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingBar from "@/components/LoadingBar";
import RegistrationCheck from "@/components/RegistrationCheck";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secure Vote India - Online Voting with Face Recognition",
  description: "A secure online voting platform with face recognition to ensure integrity and transparency in the democratic process.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <NextAuthProvider>
          <div className="flex flex-col min-h-screen">
            <LoadingBar />
            <Header />
            <RegistrationCheck />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </NextAuthProvider>
      </body>
    </html>
  );
}
