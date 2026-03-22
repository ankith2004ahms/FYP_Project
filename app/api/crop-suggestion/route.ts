import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectMongoose } from '@/lib/mongoose';
import { CropRecommendation } from '@/models';
import { getCurrentSeason, getHarvestSeason, getStateClimateData } from '@/utils/cropData';
import { generateTextWithFallback } from '@/utils/api-fallback';

// Define the expected response type
interface CropSuggestionResponse {
  message: string;
  suggestedCrops: Array<{
    name: string;
    rationale: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Crop Suggestion POST Debug ===');
    
    const { userId } = await auth();
    console.log('User ID:', userId);
    
    if (!userId) {
      console.log('No userId found - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timeRange, state, plantingSeason, soilType, language = 'english' } = await request.json();
    console.log('Request data:', { timeRange, state, plantingSeason, soilType, language });

    if (
      typeof timeRange !== 'number' ||
      !state ||
      !plantingSeason ||
      !soilType
    ) {
      return NextResponse.json(
        { error: 'Required fields: timeRange (number), state, plantingSeason, soilType' },
        { status: 400 }
      );
    }

    const climateData = getStateClimateData(state);
    console.log('Climate data:', climateData);
    
    const currentSeason = getCurrentSeason();
    const harvestSeason = getHarvestSeason(timeRange);
    console.log('Seasons:', { currentSeason, harvestSeason });
    
    let suggestions: CropSuggestionResponse = await generateCropSuggestions(
      timeRange,
      state,
      plantingSeason,
      soilType,
      currentSeason,
      harvestSeason,
      climateData,
      language
    );
    
    // Validate suggestions structure and use fallback if needed
    if (!suggestions || !suggestions.suggestedCrops || !Array.isArray(suggestions.suggestedCrops)) {
      console.error('Invalid suggestions format from generateCropSuggestions:', suggestions);
      
      // Use fallback crops
      const seasonCrops: Record<string, string[]> = {
        "Kharif": ["Rice", "Maize", "Cotton"],
        "Rabi": ["Wheat", "Barley", "Mustard"],
        "Zaid": ["Watermelon", "Cucumber", "Tomato"]
      };
      
      const defaultCrops = seasonCrops[plantingSeason] || ["Rice", "Wheat"];
      suggestions = {
        message: "AI response validation failed. Using default recommendations.",
        suggestedCrops: defaultCrops.slice(0, 3).map((crop: string) => ({
          name: crop,
          rationale: "Suitable for this season and region"
        }))
      };
      
      console.log('Using fallback suggestions:', suggestions);
    } else {
      console.log('Valid AI suggestions received:', suggestions);
    }
    // Save to database
    const cleanSeason = plantingSeason.split(' ')[0].toLowerCase();
    
    // Map season names to database enum values
    const seasonMapping: Record<string, string> = {
      'kharif': 'kharif',
      'rabi': 'rabi',
      'zaid': 'zaid',
      'summer': 'summer',
      'winter': 'winter',
      'monsoon': 'monsoon'
    };
    
    const dbSeason = seasonMapping[cleanSeason] || cleanSeason;
    console.log('Season mapping:', { original: plantingSeason, clean: cleanSeason, db: dbSeason });
    
    console.log('Connecting to MongoDB...');
    await connectMongoose();

    const cropRecommendation = new CropRecommendation({
      userId,
      season: dbSeason,
      location: {
        state,
        climate: climateData
      },
      soilType,
      timeRange,
      recommendedCrops: suggestions.suggestedCrops.map((crop) => ({
        cropName: crop.name,
        confidence: 85,
        rationale: crop.rationale || "Recommended based on season and regional conditions",
        expectedYield: null,
        marketPrice: null
      })),
      aiAnalysis: {
        reasoning: suggestions.message,
        confidence: 90,
        dataPoints: {
          climate: climateData,
          season: dbSeason,
          soil: soilType
        }
      },
      status: 'completed'
    });
    
    console.log('Saving to database...');
    await cropRecommendation.save();
    console.log('Crop recommendation saved successfully');
    
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error in crop-suggestion API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function generateCropSuggestions(
  timeRange: number,
  state: string,
  plantingSeason: string,
  soilType: string,
  currentSeason: string,
  harvestSeason: string,
  climateData: any,
  language: string
): Promise<CropSuggestionResponse> {
  try {
    // Default crops for each season as fallback
    const seasonCrops: Record<string, string[]> = {
      "Kharif": ["Rice", "Maize", "Cotton", "Soybean"],
      "Rabi": ["Wheat", "Barley", "Mustard", "Peas"],
      "Zaid": ["Watermelon", "Cucumber", "Tomato", "Bitter Gourd"]
    };

    const prompt = `As an agricultural expert, suggest 3-4 best crops for ${state} with ${soilType} soil for ${plantingSeason} season, considering:
    - Climate: ${JSON.stringify(climateData)}
    - Harvest time: ${timeRange} months
    - Current season: ${currentSeason}
    - Expected harvest season: ${harvestSeason}

    Return plain text only in this exact machine-readable structure:
    SUMMARY: one short summary in ${language}
    CROP: crop name in ${language}
    REASON: detailed reason in ${language}
    CROP: crop name in ${language}
    REASON: detailed reason in ${language}
    CROP: crop name in ${language}
    REASON: detailed reason in ${language}
    CROP: crop name in ${language}
    REASON: detailed reason in ${language}

    Consider factors like:
    - Temperature and rainfall patterns
    - Soil compatibility
    - Market demand
    - Growing season duration
    - Local farming practices

    IMPORTANT:
    - Keep the labels exactly as SUMMARY:, CROP:, and REASON:
    - Do not use JSON
    - Do not use markdown
    - Write the actual recommendation content in ${language}`;

    const systemPrompt = "You are an agricultural expert providing crop recommendations. Return plain text only. Never return JSON. Never use markdown code blocks. Always keep the structural labels exactly as SUMMARY:, CROP:, and REASON:. Strictly respond in the language specified by the user for the recommendation content.";

    const rawResponse = await generateTextWithFallback(
      prompt,
      `${systemPrompt} RESPOND STRICTLY IN ${language.toUpperCase()}. LANGUAGE`,
      language
    );

    console.log('Raw crop suggestion response:', rawResponse);

    let suggestions = parseCropSuggestionText(rawResponse);
    
    // Validate suggestions structure
    if (!suggestions || !suggestions.suggestedCrops || !Array.isArray(suggestions.suggestedCrops)) {
      console.error('Invalid suggestions format:', suggestions);
      // Use fallback instead of throwing error
      const seasonCrops: Record<string, string[]> = {
        "Kharif": ["Rice", "Maize", "Cotton"],
        "Rabi": ["Wheat", "Barley", "Mustard"],
        "Zaid": ["Watermelon", "Cucumber", "Tomato"]
      };
      
      const defaultCrops = seasonCrops[plantingSeason] || ["Rice", "Wheat"];
      suggestions = {
        message: "Invalid AI response format. Using default recommendations.",
        suggestedCrops: defaultCrops.slice(0, 3).map((crop: string) => ({
          name: crop,
          rationale: "Suitable for this season and region"
        }))
      } as CropSuggestionResponse;
    }
    
    console.log('Final suggestions being used:', suggestions);
    return suggestions;
  } catch (error) {
    console.error('Error generating crop suggestions:', error);
    const seasonCrops: Record<string, string[]> = {
      "Kharif": ["Rice", "Maize", "Cotton"],
      "Rabi": ["Wheat", "Barley", "Mustard"],
      "Zaid": ["Watermelon", "Cucumber", "Tomato"]
    };
    
    const defaultCrops = seasonCrops[plantingSeason] || ["Rice", "Wheat"];
    return {
      message: "Error generating AI suggestions. Using default recommendations.",
      suggestedCrops: defaultCrops.slice(0, 3).map((crop: string) => ({
        name: crop,
        rationale: "Suitable for this season and region"
      }))
    } as CropSuggestionResponse;
  }
}

function parseCropSuggestionText(rawText: string): CropSuggestionResponse {
  const cleaned = rawText.replace(/\r/g, '').trim();
  const lines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);

  let message = '';
  const suggestedCrops: CropSuggestionResponse['suggestedCrops'] = [];

  let currentCropName = '';
  let currentReasonLines: string[] = [];

  const flushCurrentCrop = () => {
    if (!currentCropName) return;
    suggestedCrops.push({
      name: currentCropName,
      rationale: currentReasonLines.join(' ').trim() || 'Suitable for this season and region'
    });
    currentCropName = '';
    currentReasonLines = [];
  };

  for (const line of lines) {
    if (line.startsWith('SUMMARY:')) {
      message = line.replace(/^SUMMARY:\s*/i, '').trim();
      continue;
    }

    if (line.startsWith('CROP:')) {
      flushCurrentCrop();
      currentCropName = line.replace(/^CROP:\s*/i, '').trim();
      continue;
    }

    if (line.startsWith('REASON:')) {
      currentReasonLines.push(line.replace(/^REASON:\s*/i, '').trim());
      continue;
    }

    if (currentCropName) {
      currentReasonLines.push(line);
    } else if (!message) {
      message = line;
    }
  }

  flushCurrentCrop();

  if (suggestedCrops.length === 0) {
    const numberedMatches = [...cleaned.matchAll(/(?:^|\n)\d+[\).\-\s]+(.+?)(?=\n\d+[\).\-\s]+|\s*$)/gs)];
    for (const match of numberedMatches.slice(0, 4)) {
      const block = match[1].trim();
      const [firstLine, ...rest] = block.split('\n').map((line) => line.trim()).filter(Boolean);
      if (!firstLine) continue;

      const splitMatch = firstLine.match(/^([^:-]+)[:\-]\s*(.+)$/);
      suggestedCrops.push({
        name: splitMatch?.[1]?.trim() || firstLine,
        rationale: [splitMatch?.[2]?.trim(), ...rest].filter(Boolean).join(' ').trim() || 'Suitable for this season and region'
      });
    }
  }

  return {
    message: message || 'Here are the best crop recommendations based on your inputs.',
    suggestedCrops
  };
}
