import { getCurrentWeather, get7DayForecast, getCoordinatesFromCity } from '../services/openWeatherService';

// List of major cities to prefetch weather data for
const MAJOR_CITIES = [
  'bangalore',
  'chennai',
  'delhi',
  'mumbai',
  'kolkata',
  'hyderabad',
  'davangere'
];

// Cache object to store weather data (would be replaced by Redis or similar in production)
let weatherCache: Record<string, any> = {};

async function updateWeatherCache() {
  console.log(`[${new Date().toISOString()}] Updating weather cache...`);
  
  try {
    for (const city of MAJOR_CITIES) {
      try {
        console.log(`Fetching data for ${city}...`);
        
        // Get coordinates for the city
        const coordinates = await getCoordinatesFromCity(city);
        
        // Fetch current weather
        const currentWeather = await getCurrentWeather(coordinates);
        
        // Fetch 7-day forecast
        const forecast = await get7DayForecast(coordinates);
        
        // Store in cache
        weatherCache[city] = {
          coordinates,
          currentWeather,
          forecast,
          timestamp: Date.now()
        };
        
        console.log(`Updated data for ${city}`);
      } catch (cityError) {
        console.error(`Error updating data for ${city}:`, cityError);
      }
    }
    
    console.log('Weather cache update completed successfully');
  } catch (error) {
    console.error('Failed to update weather cache:', error);
  }
}

// Run the update immediately on startup
updateWeatherCache();

// Then run it every hour
setInterval(updateWeatherCache, 60 * 60 * 1000);

// Export the cache for use in the API
export function getWeatherCache() {
  return weatherCache;
}

// If this is run directly (not imported)
if (require.main === module) {
  console.log('Weather cache service started');
} 