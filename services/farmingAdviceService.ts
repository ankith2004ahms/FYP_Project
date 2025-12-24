import { OpenAI } from 'openai';
import { CurrentWeather, ForecastDay } from '@/types/dashboard';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY', // Replace with your actual API key
});

interface AdviceParams {
  currentWeather: CurrentWeather;
  forecast: ForecastDay[];
  location: string;
  crop?: string;
}

export async function generateFarmingAdvice({
  currentWeather,
  forecast,
  location,
  crop
}: AdviceParams): Promise<string> {
  try {
    // Create a prompt for the AI based on weather data and crop information
    const prompt = `
You are an expert agricultural advisor with deep knowledge of farming practices, weather patterns, and crop management. 
Based on the following weather data for ${location}${crop ? ` and specifically for ${crop} cultivation` : ''}, 
provide practical and actionable advice for farmers. Your advice should cover:

1. Watering schedules and irrigation needs
2. Potential pest risks based on the current and forecasted humidity and temperature
3. Specific recommendations for crop protection
4. Any preventative measures needed based on the upcoming weather

Current Weather:
- Temperature: ${currentWeather.temp}°C
- Humidity: ${currentWeather.humidity}%
- Wind Speed: ${currentWeather.windSpeed} km/h
- Rainfall: ${currentWeather.rainfall} mm
- Condition: ${currentWeather.condition}

7-Day Forecast:
${forecast.map(day => {
  const date = new Date(day.date).toLocaleDateString();
  return `- ${date}: ${day.tempHigh}°C / ${day.tempLow}°C, ${day.condition}, ${day.rainProbability}% chance of rain, Expected rainfall: ${day.rainfall}mm`;
}).join('\n')}

Provide specific actionable advice in 3-4 sentences that farmers can implement immediately.
`;

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert agricultural advisor.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    // Return the farming advice
    return response.choices[0].message.content?.trim() || 
      'Unable to generate farming advice. Please try again later.';
    
  } catch (error) {
    console.error('Error generating farming advice:', error);
    return 'Unable to generate farming advice due to a service error. Please try again later.';
  }
} 