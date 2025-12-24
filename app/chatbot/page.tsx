'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChatMessage } from '@/types/dashboard';
import { 
  formatChatTime, 
  isValidMessage, 
  generateWelcomeMessage,
  suggestedTopics
} from '@/utils/chatbot';
import { postWithAuth } from '@/utils/api';
import OllamaStatus from '@/components/OllamaStatus';

export default function ChatbotPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check authentication
  useEffect(() => {
    setIsLoggedIn(true);
  }, []);

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
      // First try the normal request
      let response = await postWithAuth('/api/chatbot', { 
        message: input 
      });
      
      // If we get a 401, try refreshing the token and retrying the request
      if (response.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            // Try to refresh the token
            const refreshResponse = await fetch('/api/auth/refresh-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken }),
            });
            
            if (refreshResponse.ok) {
              const data = await refreshResponse.json();
              // Update tokens in localStorage
              localStorage.setItem('accessToken', data.accessToken);
              localStorage.setItem('refreshToken', data.refreshToken);
              
              // Retry the original request with the new token
              response = await postWithAuth('/api/chatbot', { 
                message: input 
              });
            }
          } catch (refreshError) {
            console.error('Error refreshing token:', refreshError);
          }
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
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

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">
          Authenticating...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-green-800">Kisan Sahayak</Link>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-green-600">Home</Link>
            </nav>
          </div>
        </div>
      </header>

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
      </div>
    </div>
  );
} 