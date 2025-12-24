"use client";

import React, { useState } from "react";
import Link from "next/link";
import { indianStates, agriculturalSeasons } from "@/utils/cropData";
import OllamaStatus from "@/components/OllamaStatus";

export default function CropSuggestionPage() {
  const [timeRange, setTimeRange] = useState(3);
  const [state, setState] = useState("");
  const [plantingSeason, setPlantingSeason] = useState("");
  const [soilType, setSoilType] = useState("");
  const [language, setLanguage] = useState("english");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    suggestedCrops: { name: string; rationale: string }[];
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simple fetch without authentication
      const response = await fetch('/api/crop-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeRange,
          state,
          plantingSeason,
          soilType,
          language
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get crop suggestions');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to get crop suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const soilTypes = [
    "Clay",
    "Sandy",
    "Loamy",
    "Silt",
    "Black Cotton Soil",
    "Red Soil",
    "Alluvial Soil",
    "Laterite Soil",
    "Not Sure"
  ];

  const languages = [
    "english",
    "hindi",
    "tamil",
    "telugu",
    "kannada",
    "malayalam",
    "marathi",
    "punjabi",
    "gujarati",
    "bengali",
    "oriya",
    "assamese"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
            <span className="border-b-4 border-green-500 pb-2">Crop Suggestion Tool</span>
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-green-700">How It Works</h2>
            <p className="mb-4 text-gray-800 font-medium">
              Our crop suggestion tool uses agricultural expertise and knowledge of climate conditions
              to recommend the most suitable and profitable crops for your region and timeline.
            </p>
            <ul className="pl-8 mb-6 space-y-3">
              {[
                "Location-specific recommendations based on climate",
                "Seasonal growing conditions consideration",
                "Planting-to-harvest timeline analysis",
                "Soil type compatibility",
                "Market potential assessment"
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2 text-xl">•</span>
                  <span className="text-gray-800 font-medium">{item}</span>
                </li>
              ))}
            </ul>
            
            <OllamaStatus />
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Enter Your Details</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    State
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 font-medium"
                    required
                  >
                    <option value="">Select your state</option>
                    {indianStates.map((stateName) => (
                      <option key={stateName} value={stateName}>
                        {stateName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Planting Season
                  </label>
                  <select
                    value={plantingSeason}
                    onChange={(e) => setPlantingSeason(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 font-medium"
                    required
                  >
                    <option value="">Select planting season</option>
                    {agriculturalSeasons.map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Soil Type
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 font-medium"
                    required
                  >
                    <option value="">Select soil type</option>
                    {soilTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    When do you want to harvest? (in months)
                  </label>
                  <div className="mt-2 px-1">
                    <input 
                      type="range" 
                      min="1" 
                      max="24" 
                      value={timeRange} 
                      onChange={(e) => setTimeRange(parseInt(e.target.value))}
                      className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                    <div className="flex justify-between text-sm text-gray-700 font-medium mt-2">
                      <span>1 month</span>
                      <span className="font-bold text-green-700">{timeRange} months</span>
                      <span>24 months</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Preferred Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 font-medium"
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full mt-8 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-bold text-lg shadow-md transition-all duration-200 hover:shadow-lg"
                disabled={loading}
              >
                {loading ? 
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Getting Suggestions...
                  </span> : 
                  'Get Crop Suggestions'
                }
              </button>
            </form>
          </div>
          
          {result && (
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-6 text-green-700">Recommended Crops</h2>
              
              {result.message && (
                <div className="mb-6 text-gray-800 font-medium p-4 bg-green-50 rounded-lg border border-green-200">
                  <p>{result.message}</p>
                </div>
              )}
              
              <div className="space-y-6">
                {result.suggestedCrops.map((crop, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-200 hover:shadow-md transition-all duration-200">
                    <h3 className="font-bold text-xl mb-3 text-green-800 border-b pb-2 border-gray-200">
                      {index + 1}. {crop.name}
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="whitespace-pre-line text-gray-800 font-medium">{crop.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-4 border-t-2 border-gray-200">
                <p className="text-sm text-gray-700 font-medium bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <span className="font-bold">Note:</span> Recommendations based on agricultural expertise and growing conditions. 
                  Actual results may vary based on local conditions, weather patterns, and management practices.
                </p>
              </div>
            </div>
          )}
          
          <div className="mt-8 text-center">
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
        </div>
      </div>
  );
} 