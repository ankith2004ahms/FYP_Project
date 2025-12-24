import { config } from 'dotenv';
config();

import '@/ai/flows/predict-plant-disease-and-suggest-treatment.ts';
import '@/ai/flows/retry-plant-disease-analysis.ts';
import '@/ai/flows/translate-text.ts';
