'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Kisan Sahayak</h3>
            <p className="text-gray-300 text-sm mb-2">
              Your intelligent farming assistant powered by AI technology
            </p>
            <p className="text-gray-400 text-xs">
              Empowering farmers with smart agricultural solutions
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/plant-disease" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Disease Detection
                </Link>
              </li>
              <li>
                <Link href="/crop-suggestion" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Crop Suggestions
                </Link>
              </li>
              <li>
                <Link href="/chatbot" className="text-gray-300 hover:text-white text-sm transition-colors">
                  AI Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-300 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                AI-Powered Disease Detection
              </li>
              <li className="flex items-center text-gray-300 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Smart Crop Recommendations
              </li>
              <li className="flex items-center text-gray-300 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                24/7 AI Assistant
              </li>
              <li className="flex items-center text-gray-300 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Data Storage & History
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-gray-300 text-sm">
                <span className="block font-medium">Email:</span> support@kisansahayak.com
              </li>
              <li className="text-gray-300 text-sm">
                <span className="block font-medium">Phone:</span> +91-XXXX-XXXX
              </li>
              <li className="text-gray-300 text-sm">
                <span className="block font-medium">Hours:</span> 24/7 Support
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Kisan Sahayak. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
