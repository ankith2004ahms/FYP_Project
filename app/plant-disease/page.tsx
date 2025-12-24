"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface DiseaseData {
  disease: string;
  date?: string;
  treatmentInfo?: string;
}

export default function PlantDiseasePage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diseaseData, setDiseaseData] = useState<DiseaseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState("english");
  const [treatmentLoading, setTreatmentLoading] = useState(false);
  const [treatmentError, setTreatmentError] = useState<string | null>(null);

  const displayTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (displayTimeoutRef.current) {
        clearTimeout(displayTimeoutRef.current);
        displayTimeoutRef.current = null;
      }
    };
  }, []);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setDiseaseData(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setTreatmentLoading(false);
    setTreatmentError(null);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("language", language);
      const response = await fetch("/api/analyze-plant", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();

      // Fetch treatment info in background immediately (no delay to Ollama)
      fetchTreatment(data.disease, language);

      // If this came from Gemini, delay showing the disease name for 5 seconds, otherwise show immediately
      const source = data.source || 'unknown';
      const displayName = data.displayName || data.disease;

      if (displayTimeoutRef.current) {
        clearTimeout(displayTimeoutRef.current);
        displayTimeoutRef.current = null;
      }

      if (source === 'gemini') {
        // show a temporary placeholder while we wait to display the name
        setDiseaseData({ disease: 'Detecting...', date: data.date });
        displayTimeoutRef.current = window.setTimeout(() => {
          setDiseaseData(prev => ({ ...(prev || {}), disease: displayName, date: data.date }));
          displayTimeoutRef.current = null;
        }, 5000);
      } else {
        setDiseaseData(prev => ({ ...(prev || {}), disease: displayName, date: data.date }));
      }
    } catch (err) {
      setError(`Failed to analyze image: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTreatment = async (disease: string, language: string) => {
    setTreatmentLoading(true);
    setTreatmentError(null);
    try {
      const res = await fetch('/api/analyze-plant/treatment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disease, language })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err?.error || `Status ${res.status}`);
      }
      const data = await res.json();
      setDiseaseData(prev => prev ? { ...prev, treatmentInfo: data.treatmentInfo } : { disease, treatmentInfo: data.treatmentInfo });
    } catch (err) {
      setTreatmentError(err instanceof Error ? err.message : String(err));
    } finally {
      setTreatmentLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Plant Disease Detection
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors duration-200">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="imageInput"
              />
              <label 
                htmlFor="imageInput"
                className="cursor-pointer block"
              >
                {imagePreview ? (
                  <div className="relative w-full h-64 mx-auto">
                    <Image 
                      src={imagePreview} 
                      alt="Selected plant" 
                      fill 
                      style={{ objectFit: "contain" }}
                      className="rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-gray-300 border-dashed rounded-lg p-12 hover:border-green-500 transition-colors duration-200">
                    <div className="flex flex-col items-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-4 text-base text-gray-600 font-medium">Click to upload an image of a diseased plant</p>
                      <p className="mt-2 text-sm text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                    </div>
                  </div>
                )}
              </label>
            </div>

            <div className="flex justify-between items-center">
              <div className="w-2/3">
                <label className="block text-slate-700 mb-2 font-medium">Select Language:</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-3 border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedImage}
                className={`px-6 py-3 text-lg rounded-lg font-semibold ${loading || !selectedImage ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'} transition-colors shadow-md`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  "Analyze Image"
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {diseaseData && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200 space-y-6">
            <div className="border-b pb-4 mb-4">
              <h2 className="text-2xl font-bold text-green-800 mb-4">Analysis Results</h2>
              <div className="flex flex-wrap gap-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex-grow">
                  <p className="text-gray-700 mb-1 font-medium">Detected Disease:</p>
                  <p className="text-xl font-bold text-green-800">{diseaseData.disease}</p>
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-xl mb-3 text-gray-800 border-b pb-2 border-gray-200">
                Treatment and Prevention Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                {treatmentLoading ? (
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Getting treatment information from the local LLM...
                  </div>
                ) : treatmentError ? (
                  <div className="text-sm text-red-600">{treatmentError}</div>
                ) : (
                  <div className="whitespace-pre-wrap text-sm font-normal text-gray-700">
                    {diseaseData.treatmentInfo || 'No treatment information available.'}
                  </div>
                )}
              </div>
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