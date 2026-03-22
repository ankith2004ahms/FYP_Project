import mongoose, { Document, Schema } from 'mongoose';

export interface IDiseaseDetection extends Document {
  userId: string;
  imageUrl: string;
  imageName: string;
  predictedDisease: string;
  confidence: number;
  treatmentRecommendation?: string;
  symptoms?: string[];
  preventiveMeasures?: string[];
  additionalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiseaseDetectionSchema = new Schema<IDiseaseDetection>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  imageName: {
    type: String,
    required: true
  },
  predictedDisease: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  treatmentRecommendation: {
    type: String,
    required: false
  },
  symptoms: [{
    type: String
  }],
  preventiveMeasures: [{
    type: String
  }],
  additionalNotes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.models.DiseaseDetection || mongoose.model<IDiseaseDetection>('DiseaseDetection', DiseaseDetectionSchema);
