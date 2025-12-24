import { NextResponse } from 'next/server';
import { cropData, getCurrentSeason, getHarvestSeason, regionClimateData } from '@/utils/cropData';

import { generateJSON, generateText } from '@/utils/ollama';
const ollama_model = process.env.OLLAMA_MODEL;

export async function POST(request: Request) {
  try {
    

    const { timeRange, state, plantingSeason, soilType, language = 'english' } = await request.json();
    
   
    const climateData = getStateClimateData(state);
    
    const currentSeason = getCurrentSeason();
    const harvestSeason = getHarvestSeason(timeRange);
    
    const suggestions = await generateCropSuggestions(
      timeRange,
      state,
      plantingSeason,
      soilType,
      currentSeason,
      harvestSeason,
      climateData,
      language
    );
    
    
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error in crop-suggestion API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getStateClimateData(state: string) {
  const stateLower = state.toLowerCase();
  
  for (const region in regionClimateData) {
    if (stateLower.includes(region) || region.includes(stateLower)) {
      return regionClimateData[region];
    }
  }
  
  const stateToRegionMap: Record<string, string> = {
    "andhra pradesh": "maharashtra",
    "telangana": "maharashtra",
    "tamil nadu": "kerala",
    "madhya pradesh": "maharashtra",
    "rajasthan": "gujarat",
    "haryana": "punjab",
    "uttar pradesh": "punjab",
    "bihar": "west bengal",
    "jharkhand": "west bengal",
    "odisha": "west bengal",
    "chhattisgarh": "maharashtra",
    "assam": "west bengal",
    "himachal pradesh": "punjab",
    "uttarakhand": "punjab"
  };
  
  if (stateToRegionMap[stateLower]) {
    return regionClimateData[stateToRegionMap[stateLower]];
  }
  
  return regionClimateData["default"];
}

async function generateCropSuggestions(
  timeRange: number,
  state: string,
  plantingSeason: string,
  soilType: string,
  currentSeason: string,
  harvestSeason: string,
  climateData: any,
  language: string = 'english'
) {
  try {
    const currentDate = new Date();
    const harvestDate = new Date();
    harvestDate.setMonth(harvestDate.getMonth() + timeRange);
    
    const selectedSeason = plantingSeason.split(" ")[0];
    
    const prompt = `
I need crop recommendations for these farming conditions:
- State: ${state}
- Soil: ${soilType}
- Season: ${selectedSeason}
- Growing period: ${timeRange} months
- Climate: ${climateData.description || `${state} climate`}
- Rainfall: ${climateData.rainfall || "Variable"}

Please recommend 3-4 suitable crops. For each crop, include:
1. The crop name
2. Why it's good for this climate, soil, and growing period

Keep each explanation brief but informative.

RESPOND IN EXACTLY THIS JSON FORMAT (very important):
{
  "message": "Brief overview of farming situation",
  "suggestedCrops": [
    {
      "name": "Crop Name",
      "rationale": "Explanation why suitable"
    },
    ...
  ]
}

Provide your response in ${language} language.
`;

    const systemPrompt = `You are an agricultural expert specialized in Indian farming. You provide accurate crop recommendations based on local conditions. You ALWAYS respond in valid JSON format exactly as requested. Respond in ${language}.`;


    try {
      // check Ollama availability early to provide a clear fallback if the daemon is down
      try {
        const { listModels } = await import('@/utils/ollama');
        await listModels(); // will throw if server unreachable
      } catch (availErr) {
        console.error('Ollama appears unreachable; skipping model generation and returning fallback response.', availErr);
        return createFallbackResponse(language);
      }

      const modelToUse = ollama_model || 'llama3.2:1b';

      try {
        // Await the model call directly. The lower-level fetch uses a configurable timeout (OLLAMA_FETCH_TIMEOUT_MS),
        // so we avoid adding another route-level timeout that could prematurely abort long-running model responses.
        const result = await generateJSON<{
          message: string;
          suggestedCrops: { name: string; rationale: string }[];
        }>(modelToUse, prompt, systemPrompt, language);

        // Attempt to coerce many possible model outputs into the canonical format
        const tryNormalizeResult = (obj: any): { message: string; suggestedCrops: { name: string; rationale: string }[] } | null => {
          if (!obj) return null;

          const normalizeCropItem = (item: any) => {
            if (!item) return { name: 'Unknown', rationale: '' };
            if (typeof item === 'string') return { name: item.split(':')[0] || 'Crop', rationale: item };
            if (typeof item === 'object') {
              // common shapes
              if (item.name && item.rationale) return { name: String(item.name), rationale: String(item.rationale) };
              if (item.crop && (item.reason || item.rationale)) return { name: String(item.crop), rationale: String(item.reason ?? item.rationale) };
              if (item.title && item.body) return { name: String(item.title), rationale: String(item.body) };
              // fallback: stringify
              return { name: String(item.name ?? item.crop ?? item.title ?? 'Crop'), rationale: String(item.rationale ?? item.reason ?? JSON.stringify(item)) };
            }
            return { name: 'Crop', rationale: String(item) };
          };

          // already in canonical form
          if (obj.message && Array.isArray(obj.suggestedCrops)) {
            return {
              message: String(obj.message),
              suggestedCrops: obj.suggestedCrops.map(normalizeCropItem)
            };
          }

          // common alternative keys
          const listCandidates = obj.suggestedCrops ?? obj.crops ?? obj.suggestions ?? obj.recommendations ?? obj.recommended ?? obj.results ?? obj.outputs;
          if (listCandidates) {
            let arr: any[] = [];
            if (typeof listCandidates === 'string') arr = [ { name: 'Recommendation', rationale: listCandidates } ];
            else if (Array.isArray(listCandidates)) arr = listCandidates;
            else if (typeof listCandidates === 'object') arr = Object.entries(listCandidates).map(([k, v]) => (typeof v === 'string' ? { name: k, rationale: v } : { name: k, rationale: JSON.stringify(v) }));

            return {
              message: obj.message ? String(obj.message) : 'Crop suggestions',
              suggestedCrops: arr.map(normalizeCropItem)
            };
          }

          // If object contains a textual field that may include JSON or a plain answer
          const textFields = ['text', 'response', 'output', 'body', 'content'];
          for (const f of textFields) {
            if (obj[f] && typeof obj[f] === 'string') {
              const maybe = extractJsonFromString(obj[f]);
              if (maybe) {
                const n = tryNormalizeResult(maybe);
                if (n) return n;
              }
              return { message: obj.message ? String(obj.message) : 'Crop suggestions', suggestedCrops: [{ name: 'Recommendation', rationale: obj[f].trim() }] };
            }
          }

          return null;
        };

        const extractJsonFromString = (str: string) => {
          if (!str) return null;
          // try to find the first {...} block
          const jsonMatch = str.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              return JSON.parse(jsonMatch[0]);
            } catch (e) {
              // ignore parse error
            }
          }
          return null;
        };

        const normalized = tryNormalizeResult(result);
        if (normalized) return normalized;

        // If normalization failed, attempt to extract JSON/text from the raw model text
        console.warn('Model returned unexpected shape; attempting to extract useful information from raw output.');

        try {
          // raw text candidates
          let rawCandidateText = '';
          try {
            if (typeof result === 'string') rawCandidateText = result;
            else if (result.response && typeof result.response === 'string') rawCandidateText = result.response;
            else if (Array.isArray(result.outputs)) rawCandidateText = result.outputs.map((o: any) => o.text ?? o.output ?? JSON.stringify(o)).join('\n');
            else rawCandidateText = JSON.stringify(result);
          } catch (e) {
            rawCandidateText = String(result);
          }

          // try to parse JSON blob from that text
          const m = extractJsonFromString(rawCandidateText);
          if (m) {
            const n2 = tryNormalizeResult(m);
            if (n2) return n2;
          }

          // final fallback: call generateText to get raw textual output and parse
          try {
            const rawText = await generateText(ollama_model, prompt, systemPrompt, language);
            console.log('Raw response (fallback):', rawText);
            const m2 = extractJsonFromString(rawText);
            if (m2) {
              const n3 = tryNormalizeResult(m2);
              if (n3) return n3;
            }

            return {
              message: 'Could not parse model response; presenting raw output',
              suggestedCrops: [
                { name: 'Raw output', rationale: (rawText || rawCandidateText || '').substring(0, 2000) }
              ]
            };
          } catch (textError) {
            console.error('Text generation fallback also failed:', textError);
            return createFallbackResponse(language);
          }
        } catch (err) {
          console.error('Unexpected error while normalizing model output:', err);
          return createFallbackResponse(language);
        }
      } catch (genErr) {
        // If model is missing/404, try to list available models and fallback to the first available
        if (String(genErr).includes('404') || /model\s+'?\w+'?\s+not\s+found/i.test(String(genErr))) {
          try {
            const { listModels } = await import('@/utils/ollama');
            const available = await listModels();
            if (available && available.length > 0) {
              console.warn('Configured Ollama model not found; falling back to available model:', available[0]);
              const fallback = await generateJSON<{
                message: string;
                suggestedCrops: { name: string; rationale: string }[];
              }>(available[0], prompt, systemPrompt, language);

              if (fallback && fallback.message && Array.isArray(fallback.suggestedCrops)) {
                return fallback;
              }
            }
          } catch (listErr) {
            console.error('Failed to list available Ollama models for fallback:', listErr);
          }
        }

        // rethrow to let the upper fallback (text extraction) handle it
        throw genErr;
      }
    } catch (error) {
      console.error('Error with JSON generation, falling back to text extraction:', error);
      
      try {
        const rawText = await generateText(ollama_model, prompt, systemPrompt);
        console.log('Raw response:', rawText);
        
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[0]);
            
            if (extractedJson && extractedJson.message && Array.isArray(extractedJson.suggestedCrops)) {
              return extractedJson;
            }
          } catch (err) {
            console.error('Failed to parse extracted JSON:', err);
          }
        }
        
        return {
          message: "Based on your criteria, here are some crop suggestions:",
          suggestedCrops: [
            {
              name: "General Recommendation",
              rationale: rawText.substring(0, 500)
            }
          ]
        };
      } catch (textError) {
        console.error('Text generation fallback also failed:', textError);
        return createFallbackResponse(language);
      }
    }
  } catch (error) {
    console.error('Error generating crop suggestions:', error);
    return createFallbackResponse(language);
  }
}

function createFallbackResponse(language: string) {
  const messages = {
    english: {
      message: "We encountered a technical issue while analyzing your data.",
      error: "Please try again with different parameters or contact support if the problem persists."
    },
    hindi: {
      message: "आपके डेटा का विश्लेषण करते समय हमें एक तकनीकी समस्या का सामना करना पड़ा।",
      error: "कृपया अलग पैरामीटर के साथ फिर से प्रयास करें या यदि समस्या बनी रहती है तो सहायता से संपर्क करें।"
    }
  };
  
  const lang = language.toLowerCase();
  const msg = messages[lang as keyof typeof messages] || messages.english;
  
  return {
    message: msg.message,
    suggestedCrops: [
      {
        name: "Temporary Issue",
        rationale: msg.error
      }
    ]
  };
}