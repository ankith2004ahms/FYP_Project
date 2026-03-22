"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import ProtectedRoute from "@/components/ProtectedRoute";
import Footer from "@/components/Footer";
import { getWithClerkAuth, deleteWithClerkAuth } from "@/utils/clerk-fetch";

interface DiseaseDetection {
  _id: string;
  imageUrl: string;
  imageName: string;
  predictedDisease: string;
  confidence: number;
  treatmentRecommendation?: string;
  createdAt: string;
}

interface CropRecommendation {
  _id: string;
  season: string;
  location: {
    state: string;
    soilType: string;
    climate?: any;
  };
  timeRange: number;
  recommendedCrops: Array<{
    cropName: string;
    confidence: number;
    rationale?: string;
  }>;
  aiAnalysis?: {
    reasoning: string;
    confidence: number;
    dataPoints: any;
  };
  createdAt: string;
}

interface ChatbotConversation {
  _id: string;
  title?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  createdAt: string;
}

export default function DashboardPage() {
  const { isSignedIn, user } = useUser();
  const [activeTab, setActiveTab] = useState<'disease' | 'crops' | 'chatbot'>('disease');
  const [diseaseHistory, setDiseaseHistory] = useState<DiseaseDetection[]>([]);
  const [cropHistory, setCropHistory] = useState<CropRecommendation[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatbotConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for selected items for detailed view
  const [selectedDisease, setSelectedDisease] = useState<DiseaseDetection | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropRecommendation | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatbotConversation | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isSignedIn, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch disease detection history
      const diseaseResponse = await getWithClerkAuth('/api/disease-detection');
      if (diseaseResponse.ok) {
        const diseaseData = await diseaseResponse.json();
        setDiseaseHistory(diseaseData.detections || []);
      }

      // Fetch crop recommendations
      const cropResponse = await getWithClerkAuth('/api/crop-recommendations');
      if (cropResponse.ok) {
        const cropData = await cropResponse.json();
        setCropHistory(cropData.recommendations || []);
      }

      // Fetch chatbot conversations
      const chatResponse = await getWithClerkAuth('/api/chatbot/conversations');
      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        setChatHistory(chatData.conversations || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'disease':
          endpoint = `/api/disease-detection/${id}`;
          break;
        case 'crops':
          endpoint = `/api/crop-recommendations/${id}`;
          break;
        case 'chatbot':
          endpoint = `/api/chatbot/conversations/${id}`;
          break;
      }

      const response = await deleteWithClerkAuth(endpoint);

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Refresh data
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  if (!isSignedIn) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h1>
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
              <p className="text-gray-600 mb-4">Please sign in to view your dashboard and history.</p>
              <Link href="/sign-in" className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user?.firstName || 'User'}!</h1>
            <p className="text-gray-600">View your farming history and saved results</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-lg mb-8 border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('disease')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'disease'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Disease Detection History
                </button>
                <button
                  onClick={() => setActiveTab('crops')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'crops'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Crop Recommendations
                </button>
                <button
                  onClick={() => setActiveTab('chatbot')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'chatbot'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  AI Chat History
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'disease' && (
                  <div>
                    <h2 className="text-xl font-bold mb-6 text-gray-800">Disease Detection History</h2>
                    {diseaseHistory.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No disease detection history yet. Start by <Link href="/plant-disease" className="text-green-600 hover:underline">analyzing a plant image</Link>.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {diseaseHistory.map((detection) => (
                          <div key={detection._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedDisease(detection)}>
                            <div className="relative w-full h-32 mb-4">
                              <Image
                                src={detection.imageUrl}
                                alt={detection.imageName}
                                fill
                                style={{ objectFit: 'cover' }}
                                className="rounded-lg"
                              />
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">{detection.predictedDisease}</h3>
                            <p className="text-sm text-gray-600 mb-2">Confidence: {detection.confidence}%</p>
                            <p className="text-xs text-gray-500 mb-4">{new Date(detection.createdAt).toLocaleDateString()}</p>
                            <div className="flex justify-between">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem(detection._id);
                                }}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Delete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDisease(detection);
                                }}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'crops' && (
                  <div>
                    <h2 className="text-xl font-bold mb-6 text-gray-800">Crop Recommendations</h2>
                    {cropHistory.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No crop recommendations yet. Get <Link href="/crop-suggestion" className="text-green-600 hover:underline">personalized crop suggestions</Link>.</p>
                    ) : (
                      <div className="space-y-4">
                        {cropHistory.map((recommendation) => (
                          <div key={recommendation._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCrop(recommendation)}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-800">{recommendation.season} Season</h3>
                                <p className="text-sm text-gray-600">{new Date(recommendation.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteItem(recommendation._id);
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCrop(recommendation);
                                  }}
                                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {recommendation.recommendedCrops.map((crop, index) => (
                                <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                  {crop.cropName} ({crop.confidence}%)
                                </span>
                              ))}
                            </div>
                            {recommendation.aiAnalysis && (
                              <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                                <p className="font-medium mb-1">AI Analysis:</p>
                                <p>{recommendation.aiAnalysis.reasoning}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chatbot' && (
                  <div>
                    <h2 className="text-xl font-bold mb-6 text-gray-800">AI Chat History</h2>
                    {chatHistory.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No chat history yet. Start a conversation with our <Link href="/chatbot" className="text-green-600 hover:underline">AI farming assistant</Link>.</p>
                    ) : (
                      <div className="space-y-4">
                        {chatHistory.map((conversation) => (
                          <div key={conversation._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedChat(conversation)}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-800">
                                  {conversation.title || `Chat from ${new Date(conversation.createdAt).toLocaleDateString()}`}
                                </h3>
                                <p className="text-sm text-gray-600">{conversation.messages.length} messages • {new Date(conversation.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteItem(conversation._id);
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedChat(conversation);
                                  }}
                                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {conversation.messages[0]?.content.substring(0, 100)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-white border-2 border-green-500 rounded-lg text-green-700 font-bold hover:bg-green-50 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
        
        {/* Detail Modals */}
        {selectedDisease && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Disease Detection Details</h2>
                <button
                  onClick={() => setSelectedDisease(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="relative w-full h-64 mb-4">
                    <Image
                      src={selectedDisease.imageUrl}
                      alt={selectedDisease.imageName}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{selectedDisease.predictedDisease}</h3>
                  <p className="text-lg text-gray-600 mb-2">Confidence: {selectedDisease.confidence}%</p>
                  <p className="text-sm text-gray-500 mb-4">Date: {new Date(selectedDisease.createdAt).toLocaleDateString()}</p>
                  {selectedDisease.treatmentRecommendation && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Treatment Recommendation</h4>
                      <p className="text-green-700">{selectedDisease.treatmentRecommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedCrop && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Crop Recommendation Details</h2>
                <button
                  onClick={() => setSelectedCrop(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">Season</h3>
                    <p className="text-gray-600">{selectedCrop.season}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Time Range</h3>
                    <p className="text-gray-600">{selectedCrop.timeRange} months</p>
                  </div>
                  {selectedCrop.location && (
                    <>
                      <div>
                        <h3 className="font-semibold text-gray-800">State</h3>
                        <p className="text-gray-600">{selectedCrop.location.state}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Soil Type</h3>
                        <p className="text-gray-600">{selectedCrop.location.soilType}</p>
                      </div>
                    </>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Recommended Crops</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedCrop.recommendedCrops.map((crop, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">{crop.cropName}</h4>
                        <p className="text-sm text-gray-600 mb-2">Confidence: {crop.confidence}%</p>
                        {crop.rationale && (
                          <div className="text-sm text-gray-700">
                            <p className="font-medium mb-1">Why this crop:</p>
                            <p>{crop.rationale}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedCrop.aiAnalysis && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">AI Analysis</h3>
                    <p className="text-blue-700">{selectedCrop.aiAnalysis.reasoning}</p>
                    <p className="text-sm text-blue-600 mt-2">Confidence: {selectedCrop.aiAnalysis.confidence}%</p>
                  </div>
                )}
                
                <div className="text-sm text-gray-500">
                  Created: {new Date(selectedCrop.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Chat Conversation Details</h2>
                <button
                  onClick={() => setSelectedChat(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {selectedChat.title || `Chat from ${new Date(selectedChat.createdAt).toLocaleDateString()}`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedChat.messages.length} messages • {new Date(selectedChat.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedChat.messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
