'use server';
/**
 * @fileOverview Predicts plant disease from an image and suggests treatment steps.
 *
 * - predictPlantDiseaseAndSuggestTreatment - A function that handles the plant disease prediction and treatment suggestion process.
 * - PredictPlantDiseaseAndSuggestTreatmentInput - The input type for the predictPlantDiseaseAndSuggestTreatment function.
 * - PredictPlantDiseaseAndSuggestTreatmentOutput - The return type for the predictPlantDiseaseAndSuggestTreatment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { translateText } from './translate-text';

const PredictPlantDiseaseAndSuggestTreatmentInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  targetLanguage: z.string().optional().describe('The target language for the response.'),
});
export type PredictPlantDiseaseAndSuggestTreatmentInput = z.infer<typeof PredictPlantDiseaseAndSuggestTreatmentInputSchema>;

const PredictPlantDiseaseAndSuggestTreatmentOutputSchema = z.object({
  disease: z.string().describe('The predicted disease of the plant.'),
  treatment: z.string().describe('Suggested treatment steps for the disease.'),
});
export type PredictPlantDiseaseAndSuggestTreatmentOutput = z.infer<typeof PredictPlantDiseaseAndSuggestTreatmentOutputSchema>;

export async function predictPlantDiseaseAndSuggestTreatment(input: PredictPlantDiseaseAndSuggestTreatmentInput): Promise<PredictPlantDiseaseAndSuggestTreatmentOutput> {
  return predictPlantDiseaseAndSuggestTreatmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictPlantDiseaseAndSuggestTreatmentPrompt',
  input: {schema: PredictPlantDiseaseAndSuggestTreatmentInputSchema},
  output: {schema: PredictPlantDiseaseAndSuggestTreatmentOutputSchema},
  prompt: `You are an expert in plant diseases. Analyze the image of the plant and identify the disease. Then, suggest treatment steps to cure the plant.

Plant Image: {{media url=photoDataUri}}

Respond with the disease and the treatment steps.`,
});

const predictPlantDiseaseAndSuggestTreatmentFlow = ai.defineFlow(
  {
    name: 'predictPlantDiseaseAndSuggestTreatmentFlow',
    inputSchema: PredictPlantDiseaseAndSuggestTreatmentInputSchema,
    outputSchema: PredictPlantDiseaseAndSuggestTreatmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    if (input.targetLanguage && input.targetLanguage !== 'en' && output) {
      const translatedDisease = await translateText({ text: output.disease, targetLanguage: input.targetLanguage });
      const translatedTreatment = await translateText({ text: output.treatment, targetLanguage: input.targetLanguage });
      
      return {
        disease: typeof translatedDisease.translation === 'string' ? translatedDisease.translation : output.disease,
        treatment: typeof translatedTreatment.translation === 'string' ? translatedTreatment.translation : output.treatment,
      };
    }
    
    return output!;
  }
);
