import axios from 'axios';
import { CurrentWeather, ForecastDay } from '@/types/dashboard';

const API_KEY = process.env.OPENWEATHER_API_KEY || 'YOUR_API_KEY'; // Replace with your actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface Coordinates {
  lat: number;
  lon: number;
}

// Get current weather data
export async function getCurrentWeather(coords: Coordinates): Promise<CurrentWeather> {
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat: coords.lat,
        lon: coords.lon,
        appid: API_KEY,
        units: 'metric' // Use metric for Celsius
      }
    });

    const data = response.data;
    
    return {
      temp: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      rainfall: data.rain ? (data.rain['1h'] || 0) : 0,
      condition: mapWeatherCondition(data.weather[0].main),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching current weather:', error);
    throw new Error('Failed to fetch current weather data');
  }
}

// Get 7-day forecast
export async function get7DayForecast(coords: Coordinates): Promise<ForecastDay[]> {
  try {
    const response = await axios.get(`${BASE_URL}/onecall`, {
      params: {
        lat: coords.lat,
        lon: coords.lon,
        exclude: 'current,minutely,hourly,alerts',
        appid: API_KEY,
        units: 'metric'
      }
    });

    const dailyData = response.data.daily;
    
    // Map the daily data to our ForecastDay format (first 7 days)
    return dailyData.slice(0, 7).map((day: any) => ({
      date: new Date(day.dt * 1000).toISOString(),
      tempHigh: Math.round(day.temp.max),
      tempLow: Math.round(day.temp.min),
      condition: mapWeatherCondition(day.weather[0].main),
      rainfall: day.rain || 0,
      rainProbability: Math.round(day.pop * 100) // Probability of precipitation (0-1)
    }));
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw new Error('Failed to fetch forecast data');
  }
}

// Get location from city name
export async function getCoordinatesFromCity(city: string): Promise<Coordinates> {
  try {
    const response = await axios.get(`http://api.openweathermap.org/geo/1.0/direct`, {
      params: {
        q: city,
        limit: 1,
        appid: API_KEY
      }
    });

    if (response.data.length === 0) {
      throw new Error('Location not found');
    }

    return {
      lat: response.data[0].lat,
      lon: response.data[0].lon
    };
  } catch (error) {
    console.error('Error getting coordinates from city name:', error);
    throw new Error('Failed to get location coordinates');
  }
}

// Map OpenWeatherMap conditions to our app's conditions
function mapWeatherCondition(condition: string): string {
  const conditionMap: Record<string, string> = {
    'Clear': 'Clear',
    'Clouds': 'Cloudy',
    'Drizzle': 'Light Rain',
    'Rain': 'Rain',
    'Thunderstorm': 'Thunderstorm',
    'Snow': 'Snow',
    'Mist': 'Fog',
    'Fog': 'Fog',
    'Haze': 'Fog'
  };

  return conditionMap[condition] || condition;
} 