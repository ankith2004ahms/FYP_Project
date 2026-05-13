/**
 * API Fallback Utility
 * Primary: Gemini API (when internet is available)
 * Fallback: Ollama (when Gemini fails or no internet)
 */

import { predictDiseaseFromImage } from './gemini';
import { generateText, generateJSON, isOllamaAvailable } from './ollama';

function getGeminiApiKey(): string | null {
  // return 'AIzaSyAgsr5rBkoKN3QeQmywwaT-cIeafDre-u4' || null;
  const geminiKey = 'AIzaSyAT6hEEHNrlt9M1Z_aLNYGwNjTj4biUOh8';
  return geminiKey || null;
}

function stripMarkdownCodeFences(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

function extractFirstJSONObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (escaping) {
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') depth++;
      if (char === '}') {
        depth--;
        if (depth === 0) {
          return text.slice(start, i + 1);
        }
      }
    }
  }

  return null;
}

function normalizeJsonLikeText(text: string): string {
  return text
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .trim();
}

function escapeRawNewlinesInStrings(text: string): string {
  let result = '';
  let inString = false;
  let escaping = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escaping) {
      result += char;
      escaping = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escaping = true;
      continue;
    }

    if (char === '"') {
      result += char;
      inString = !inString;
      continue;
    }

    if (inString && char === '\n') {
      result += '\\n';
      continue;
    }

    result += char;
  }

  return result;
}

function removeTrailingCommas(text: string): string {
  return text.replace(/,\s*([}\]])/g, '$1');
}

function parseJsonWithRepair<T>(rawText: string): T {
  const attempts: string[] = [];

  attempts.push(rawText.trim());

  const stripped = stripMarkdownCodeFences(rawText);
  if (stripped !== rawText.trim()) {
    attempts.push(stripped);
  }

  const extracted = extractFirstJSONObject(stripped);
  if (extracted) {
    attempts.push(extracted);
  }

  const repairedSources = new Set<string>();
  for (const candidate of [...attempts]) {
    const normalized = normalizeJsonLikeText(candidate);
    const repaired = removeTrailingCommas(escapeRawNewlinesInStrings(normalized));
    if (!repairedSources.has(repaired)) {
      repairedSources.add(repaired);
      attempts.push(repaired);
    }
  }

  let lastError: unknown;
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate) as T;
    } catch (error) {
      lastError = error;
    }
  }

  console.error('Failed JSON parse candidates:', attempts);
  throw lastError instanceof Error ? lastError : new Error('Failed to parse JSON response');
}

// Internet connectivity check
export async function isInternetAvailable(timeoutMs = 3000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    // Use a lightweight URL that responds with 204
    const resp = await fetch('https://clients3.google.com/generate_204', { 
      method: 'GET', 
      signal: controller.signal 
    });
    clearTimeout(id);
    return resp && resp.status === 204;
  } catch (e) {
    return false;
  }
}

// Gemini API availability check
export async function isGeminiAvailable(timeoutMs = 5000): Promise<boolean> {
  try {
    const geminiKey = getGeminiApiKey();
    if (!geminiKey) {
      console.error('No Gemini API key provided');
      return false;
    }

    console.log('Testing Gemini API availability...');
    
    // First try to list models (lighter request)
    const modelsUrl = `https://generativelanguage.googleapis.com/v1/models?key=${geminiKey}`;
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    
    const resp = await fetch(modelsUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(id);
    
    if (resp.ok) {
      const data = await resp.json();
      const hasGeminiFlash = data.models?.some((model: any) => model.name === 'models/gemini-2.5-flash');
      console.log('Gemini API available, gemini-2.0-flash model:', hasGeminiFlash);
      return hasGeminiFlash;
    } else {
      const errorText = await resp.text();
      console.error('Gemini API check failed:', resp.status, errorText);
      return false;
    }
  } catch (e) {
    console.error('Gemini availability check failed:', e);
    return false;
  }
}

// Gemini text generation
async function generateGeminiText(
  prompt: string,
  systemPrompt?: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<string> {
  const geminiKey = getGeminiApiKey();
  if (!geminiKey) {
    throw new Error('Gemini API key missing (set GEMINI_API_KEY in .env)');
  }
  
  const requestBody = {
    contents: [{
      parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(geminiKey)}`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('Gemini text response:', text);
  return text;
}

// Gemini JSON generation
async function generateGeminiJSON<T>(
  prompt: string,
  systemPrompt?: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<T> {
  const geminiKey = getGeminiApiKey();
  if (!geminiKey) {
    throw new Error('Gemini API key missing (set GEMINI_API_KEY in .env)');
  }
  
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  
  const requestBody = {
    contents: [{
      parts: [{ text: fullPrompt }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048
    }
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(geminiKey)}`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini JSON API error:', response.status, errorText);
    throw new Error(`Gemini JSON API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('Gemini JSON response:', text);

  try {
    return parseJsonWithRepair<T>(text);
  } catch (parseError) {
    console.error('Failed to parse Gemini JSON response:', parseError);
    console.error('No valid JSON found in Gemini response:', text);
    throw new Error('Failed to parse Gemini JSON response');
  }
}

// Unified text generation with fallback
export async function generateTextWithFallback(
  prompt: string,
  systemPrompt?: string,
  language: string = 'english',
  options: {
    modelName?: string;
    timeoutMs?: number;
    useImage?: boolean;
    imageBase64?: string;
    mimeType?: string;
  } = {}
): Promise<string> {
  const {
    modelName = 'gemini-2.5-flash',
    timeoutMs = 10000,
    useImage = false,
    imageBase64,
    mimeType = 'image/jpeg'
  } = options;

  // Check internet connectivity
  console.log('Checking internet connectivity...');
  const hasInternet = await isInternetAvailable(3000);
  
  if (hasInternet) {
    console.log('Internet available, checking Gemini API...');
    
    // Check Gemini API availability
    const hasGemini = await isGeminiAvailable(5000);
    
    if (hasGemini) {
      console.log('Gemini API available, attempting to use Gemini...');
      try {
        if (useImage && imageBase64) {
          // Use Gemini for image analysis (disease detection)
          const result = await predictDiseaseFromImage(imageBase64, mimeType, modelName, language);
          return result.disease || result.displayName || 'Unknown disease';
        } else {
          // Use Gemini for text generation (chatbot, crop suggestions, treatment)
          return await generateGeminiText(prompt, systemPrompt, modelName);
        }
      } catch (geminiError) {
        console.warn('Gemini API failed, falling back to Ollama:', geminiError);
        return await fallbackToOllama(prompt, systemPrompt, language);
      }
    } else {
      console.warn('Gemini API not available, falling back to Ollama');
      return await fallbackToOllama(prompt, systemPrompt, language);
    }
  } else {
    console.warn('No internet connectivity, using Ollama');
    return await fallbackToOllama(prompt, systemPrompt, language);
  }
}

// Fallback to Ollama
async function fallbackToOllama(
  prompt: string,
  systemPrompt?: string,
  language: string = 'english'
): Promise<string> {
  console.log('Using Ollama as fallback...');
  
  // Check if Ollama is available
  const ollamaAvailable = await isOllamaAvailable(3000);
  if (!ollamaAvailable) {
    throw new Error('Neither Gemini nor Ollama are available');
  }

  // Use Ollama's generateText function
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2:1b';
  return await generateText(ollamaModel, prompt, systemPrompt, language);
}

// Unified JSON generation with fallback
export async function generateJSONWithFallback<T>(
  prompt: string,
  systemPrompt?: string,
  language: string = 'english',
  options: {
    modelName?: string;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const { modelName = 'gemini-2.5-flash', timeoutMs = 10000 } = options;

  // Check internet connectivity
  const hasInternet = await isInternetAvailable(3000);
  
  if (hasInternet) {
    console.log('Internet available, checking Gemini API...');
    const hasGemini = await isGeminiAvailable(5000);
    
    if (hasGemini) {
      console.log('Gemini API available, attempting to use Gemini...');
      try {
        return await generateGeminiJSON<T>(prompt, systemPrompt, modelName);
      } catch (geminiError) {
        console.warn('Gemini API failed, falling back to Ollama:', geminiError);
        return await fallbackToOllamaJSON<T>(prompt, systemPrompt, language);
      }
    } else {
      console.warn('Gemini API not available, falling back to Ollama');
      return await fallbackToOllamaJSON<T>(prompt, systemPrompt, language);
    }
  } else {
    console.warn('No internet connectivity, using Ollama');
    return await fallbackToOllamaJSON<T>(prompt, systemPrompt, language);
  }
}

// Fallback to Ollama for JSON
async function fallbackToOllamaJSON<T>(
  prompt: string,
  systemPrompt?: string,
  language: string = 'english'
): Promise<T> {
  console.log('Using Ollama JSON fallback...');
  
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2:1b';
  return await generateJSON<T>(ollamaModel, prompt, systemPrompt, language);
}

// Disease detection with fallback
export async function detectDiseaseWithFallback(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  language: string = 'english'
): Promise<{ disease: string; displayName?: string; source: string }> {
  // Check internet connectivity
  const hasInternet = await isInternetAvailable(3000);
  
  if (hasInternet) {
    console.log('Internet available, checking Gemini API...');
    const hasGemini = await isGeminiAvailable(5000);
    
    if (hasGemini) {
      console.log('Gemini API available, attempting disease detection with Gemini...');
      try {
        const result = await predictDiseaseFromImage(imageBase64, mimeType, 'gemini-2.5-flash', language);
        return {
          disease: result.disease,
          displayName: result.displayName,
          source: 'gemini'
        };
      } catch (geminiError) {
        console.warn('Gemini disease detection failed, falling back to Ollama:', geminiError);
        return await fallbackToOllamaDisease(imageBase64, language);
      }
    } else {
      console.warn('Gemini API not available, falling back to Ollama for disease detection');
      return await fallbackToOllamaDisease(imageBase64, language);
    }
  } else {
    console.warn('No internet connectivity, using Ollama for disease detection');
    return await fallbackToOllamaDisease(imageBase64, language);
  }
}

// Fallback to Ollama for disease detection
async function fallbackToOllamaDisease(
  imageBase64: string,
  language: string = 'english'
): Promise<{ disease: string; displayName?: string; source: string }> {
  console.log('Using Ollama disease detection fallback...');
  
  // This would need to be implemented - Ollama doesn't natively support image analysis
  // For now, return a generic response
  throw new Error('Ollama disease detection not implemented - requires Python script integration');
}
