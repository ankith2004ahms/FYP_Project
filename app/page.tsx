'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import HeroBackground from './components/HeroBackground';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const accessToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    
    if (accessToken && storedUser) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-700">Kisan Sahayak</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-green-600">Home</Link>
              <Link href="/plant-disease" className="text-gray-700 hover:text-green-600">Disease Detection</Link>
              <Link href="/crop-suggestion" className="text-gray-700 hover:text-green-600">Crop Suggestion</Link>
              <Link href="/chatbot" className="text-gray-700 hover:text-green-600">AI Assistant</Link>

            </nav>
            <div className="hidden md:flex space-x-4">
              {!isLoggedIn && (
                <>
                  <Link href="/auth/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200">
                    Sign In
                  </Link>
                  <Link href="/auth/register" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                    Sign Up
                  </Link>
                </>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-20 bg-gradient-to-b from-green-700 to-green-500 text-white bg-opacity-80 bg-cover bg-center relative overflow-hidden">
        <HeroBackground />
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-shadow">
            Empowering Farmers with<br />
            <span className="text-green-300">AI & Technology</span>
          </h2>
          <p className="text-xl mb-8">
            Get instant plant disease diagnosis, crop suggestions, and farming insights powered by advanced AI technology.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/plant-disease" className="btn-primary">
              Upload Plant Image
            </Link>
            <Link href="/chatbot" className="btn-secondary">
              Chat with AI
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">AI-powered farming solutions</h2>
            <p className="mt-4 text-lg text-gray-600">
              Our platform offers advanced tools to help farmers make data-driven decisions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plant Disease Detection */}
            <div className="border rounded-lg p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-4 text-slate-700">Plant Disease Detection</h3>
              <p className="text-gray-600 mb-6">
                Upload an image of a diseased plant and get instant AI-powered diagnosis with treatment recommendations.
              </p>
              <div className="text-center">
                <Link href="/plant-disease" className="inline-block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md text-center">
                  Upload Image
                </Link>
              </div>
            </div>

            {/* Crop Suggestion */}
            <div className="border rounded-lg p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-4 text-slate-700">Crop Suggestion</h3>
              <p className="text-gray-600 mb-6">
                Get personalized crop suggestions based on your location, season, and market forecasts.
              </p>
              <div className="text-center">
                <Link href="/crop-suggestion" className="inline-block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md text-center">
                  Get Suggestions
                </Link>
              </div>
            </div>

            {/* Soil Analysis */}
            <div className="border rounded-lg p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-4 text-slate-700">AI Assistant</h3>
              <p className="text-gray-600 mb-6">
                Chat with our AI farming assistant to get quick answers to all your agricultural questions and expert advice.
              </p>
              <div className="text-center">
                <Link href="/chatbot" className="inline-block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md text-center">
                  Ask AI Assistant
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-700 text-white relative overflow-hidden">
        <HeroBackground className="opacity-10" />
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your farming?</h2>
          <p className="text-xl mb-8">
            Join thousands of farmers using AgriLearnNetwork to improve crop yields, prevent diseases, and optimize their farming operations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {!isLoggedIn && (
              <Link href="/auth/register" className="btn-secondary">
                Sign Up Now
              </Link>
            )}
            <Link href="/plant-disease" className="px-6 py-3 border border-white hover:bg-green-600 rounded-md font-medium">
              Try Disease Detection
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-green-700 mb-4">AgriLearnNetwork</h3>
              <p className="text-gray-600">
                Empowering farmers with AI-driven solutions for sustainable agriculture and increased productivity.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">FEATURES</h4>
              <ul className="space-y-2">
                <li><Link href="/plant-disease" className="text-gray-600 hover:text-green-600">Disease Detection</Link></li>
                <li><Link href="/crop-suggestion" className="text-gray-600 hover:text-green-600">Crop Suggestions</Link></li>
                <li><Link href="/chatbot" className="text-gray-600 hover:text-green-600">AI Assistant</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">RESOURCES</h4>
              <ul className="space-y-2">

                {!isLoggedIn && (
                  <>
                    <li><Link href="/auth/login" className="text-gray-600 hover:text-green-600">Sign In</Link></li>
                    <li><Link href="/auth/register" className="text-gray-600 hover:text-green-600">Sign Up</Link></li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">CONTACT</h4>
              <p className="text-gray-600 mb-2">info@agrilearnetwork.com</p>
              <p className="text-gray-600 mb-4">+1 (234) 567-890</p>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500">
            <p>© 2024 AgriLearnNetwork. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
