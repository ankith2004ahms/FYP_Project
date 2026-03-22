'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ChatMessage } from '@/types/dashboard';
import { 
  formatChatTime, 
  isValidMessage, 
  generateWelcomeMessage,
  suggestedTopics
} from '@/utils/chatbot';
import { postWithClerkAuth } from '@/utils/clerk-fetch';
import OllamaStatus from '@/components/OllamaStatus';
import ProtectedRoute from '@/components/ProtectedRoute';
import Footer from '@/components/Footer';

export default function ChatbotPage() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([generateWelcomeMessage()]);
    }
  }, [messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidMessage(input)) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');
    
    try {
      // Use Clerk authenticated request
      const response = await postWithClerkAuth('/api/chatbot', { 
        message: input 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData?.error || `Failed to get response from AI (Status: ${response.status})`
        );
      }
      
      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError('Error: ' + (err instanceof Error ? err.message : 'Something went wrong'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-green-700 text-white">
              <h1 className="text-2xl font-bold">AI Farming Assistant</h1>
              <p className="text-sm">Ask any farming or agricultural questions</p>
            </div>
            
            <div className="p-4 bg-white border-b">
              <OllamaStatus />
            </div>
            
            {/* Chat Messages */}
            <div className="h-[60vh] overflow-y-auto p-4 bg-gray-50">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`mb-4 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div 
                    className={`inline-block p-3 rounded-lg max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-green-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p 
                      className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      {formatChatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center text-left mb-4">
                  <div className="inline-block p-3 rounded-lg max-w-[80%] bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-800 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-800 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-800 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat Input */}
            <div className="border-t">
              <form onSubmit={handleSubmit} className="flex p-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your farming question here..."
                  className="flex-grow px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className={`px-4 py-2 bg-green-700 text-white rounded-r-lg font-medium ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-800'
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
          
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-3 text-green-800">Suggested Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInput(topic);
                  }}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-gray-800"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transform transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </ProtectedRoute>
  );
} 