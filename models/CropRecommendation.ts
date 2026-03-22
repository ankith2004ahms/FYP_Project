import mongoose, { Document, Schema } from 'mongoose';

export interface ICropRecommendation extends Document {
  userId: string;
  location: {
    latitude?: number;
    longitude?: number;
    city?: string;
    state?: string;
    country?: string;
  };
  soilType?: string;
  season: string;
  timeRange?: number;
  landSize?: number;
  landUnit?: string;
  recommendedCrops: {
    cropName: string;
    confidence: number;
    expectedYield?: string;
    marketPrice?: string;
    growingPeriod?: string;
    waterRequirement?: string;
    soilSuitability?: string;
  }[];
  weatherConditions?: {
    temperature?: number;
    humidity?: number;
    rainfall?: number;
    soilMoisture?: number;
  };
  aiAnalysis?: {
    reasoning?: string;
    confidence?: number;
    dataPoints?: {
      climate?: unknown;
      season?: string;
      soil?: string;
    };
  };
  additionalAdvice?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CropRecommendationSchema = new Schema<ICropRecommendation>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    state: String,
    country: String
  },
  soilType: {
    type: String,
    required: false
  },
  season: {
    type: String,
    required: true,
    enum: ['spring', 'summer', 'autumn', 'winter', 'monsoon', 'kharif', 'rabi', 'zaid']
  },
  timeRange: {
    type: Number,
    required: false
  },
  landSize: {
    type: Number,
    required: false
  },
  landUnit: {
    type: String,
    required: false,
    enum: ['acres', 'hectares', 'sqm', 'bigha', 'kanal']
  },
  recommendedCrops: [{
    cropName: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    expectedYield: String,
    marketPrice: String,
    growingPeriod: String,
    waterRequirement: String,
    soilSuitability: String,
    rationale: {
      type: String,
      required: false
    }
  }],
  weatherConditions: {
    temperature: Number,
    humidity: Number,
    rainfall: Number,
    soilMoisture: Number
  },
  aiAnalysis: {
    reasoning: String,
    confidence: Number,
    dataPoints: {
      climate: Schema.Types.Mixed,
      season: String,
      soil: String
    }
  },
  additionalAdvice: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.models.CropRecommendation || mongoose.model<ICropRecommendation>('CropRecommendation', CropRecommendationSchema);
