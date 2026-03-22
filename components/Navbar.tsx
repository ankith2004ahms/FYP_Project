'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { UserButton, SignInButton, SignUpButton } from '@clerk/nextjs';

export default function Navbar() {
  const { isSignedIn } = useUser();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center py-3 gap-4">
          <div className="justify-self-start">
            <Link href="/" className="text-xl font-bold text-green-700 hover:text-green-800 transition-colors">Kisan Sahayak</Link>
          </div>

          {isSignedIn && (
            <div className="hidden md:flex items-center justify-center space-x-6">
              <Link href="/plant-disease" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">Disease Detection</Link>
              <Link href="/crop-suggestion" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">Crop Suggestion</Link>
              <Link href="/chatbot" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">AI Assistant</Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">Dashboard</Link>
            </div>
          )}
          
          <div className="flex items-center space-x-4 justify-self-end">
            {isSignedIn ? (
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                  },
                }}
              />
            ) : (
              <div className="flex items-center space-x-3">
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
