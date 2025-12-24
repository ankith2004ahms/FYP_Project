// Disease Log Types
export interface DiseaseLog {
  id: string;
  cropName: string;
  diseaseName: string;
  diagnosisDate: string;
  severity: 'Low' | 'Medium' | 'High';
  region: string;
  userId: string;
}

// Commodity Price Types
export interface PriceDataPoint {
  date: string;
  price: number;
}

export interface CropPriceComparison {
  crop: string;
  price: number;
}

export interface CommodityPriceData {
  crop: string;
  region: string;
  range: string;
  priceHistory: PriceDataPoint[];
  comparisonData: CropPriceComparison[];
}

// Weather Types
export interface CurrentWeather {
  temp: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  condition: string;
  timestamp: string;
}

export interface ForecastDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  rainfall: number;
  rainProbability: number;
}

export interface WeatherAdvice {
  location: string;
  crop: string;
  currentWeather: CurrentWeather;
  forecast: ForecastDay[];
  advice: string;
}

// Soil Health Types
export interface SoilHealth {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicMatter: number;
  texture?: string;
  moisture: number;
  lastUpdated?: string;
}

export interface SoilStatsData {
  userId: string;
  currentSoilHealth: SoilHealth;
  historicalData: SoilHealth[];
  recommendations: string[];
}

// GPT Alert Types
export interface GptAlert {
  id: string;
  type: 'disease' | 'price' | 'weather' | 'policy';
  severity: 'low' | 'medium' | 'high';
  message: string;
  regions: string[];
  crops: string[];
  created: string;
}

// Chatbot Types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
} 