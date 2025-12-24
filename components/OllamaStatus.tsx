import React, { useState, useEffect } from 'react';
import { listModels } from '@/utils/ollama';

export default function OllamaStatus() {
  const [models, setModels] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkOllamaStatus = async () => {
      setLoading(true);
      try {
        const availableModels = await listModels();
        setModels(availableModels);
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setIsConnected(false);
        setError('Could not connect to Ollama service');
        console.error('Error checking Ollama status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkOllamaStatus();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg mt-4">
        <p className="text-gray-700">Checking Ollama status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded-lg mt-4">
        <h3 className="font-bold text-red-800">Ollama Service Error</h3>
        <p className="text-red-700">{error}</p>
        <p className="text-sm mt-2 text-red-600">
          Make sure Ollama is installed and running on http://localhost:11434
        </p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 p-4 rounded-lg mt-4 border border-green-200">
      <div className="flex items-center">
        <div className="h-4 w-4 bg-green-500 rounded-full mr-2"></div>
        <h3 className="font-bold text-green-800">Ollama Connected</h3>
      </div>
      {models.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-green-700">Available models:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {models.map((model) => (
              <span 
                key={model} 
                className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
              >
                {model}
              </span>
            ))}
          </div>
        </div>
      )}
      {models.length === 0 && (
        <p className="text-sm mt-1 text-amber-600">
          Connected but no models found. Use "ollama pull llama3" to download a model.
        </p>
      )}
    </div>
  );
} 