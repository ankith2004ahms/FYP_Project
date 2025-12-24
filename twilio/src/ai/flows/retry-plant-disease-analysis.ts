'use server';
/**
 * @fileOverview Implements a retry mechanism for plant disease analysis.
 *
 * - retryPlantDiseaseAnalysis - A function that retries the plant disease analysis process.
 * - RetryPlantDiseaseAnalysisInput - The input type for the retryPlantDiseaseAnalysis function.
 * - RetryPlantDiseaseAnalysisOutput - The return type for the retryPlantDiseaseAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RetryPlantDiseaseAnalysisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  previousDiagnosis: z.string().optional().describe('The previous diagnosis result.'),
});
export type RetryPlantDiseaseAnalysisInput = z.infer<typeof RetryPlantDiseaseAnalysisInputSchema>;

const RetryPlantDiseaseAnalysisOutputSchema = z.object({
  diseasePrediction: z.string().describe('The predicted plant disease.'),
  solution: z.string().describe('The solution to the predicted disease.'),
});
export type RetryPlantDiseaseAnalysisOutput = z.infer<typeof RetryPlantDiseaseAnalysisOutputSchema>;

export async function retryPlantDiseaseAnalysis(
  input: RetryPlantDiseaseAnalysisInput
): Promise<RetryPlantDiseaseAnalysisOutput> {
  return retryPlantDiseaseAnalysisFlow(input);
}

const generateSolution = ai.defineTool({
  name: 'generateSolution',
  description: 'Generates a solution for a given plant disease.',
  inputSchema: z.object({
    disease: z.string().describe('The name of the plant disease.'),
  }),
  outputSchema: z.string(),
},
async (input) => {
  const {text} = await ai.generate({
    prompt: `Provide a detailed solution, including treatment steps and preventive measures, for the plant disease: ${input.disease}`,
  });
  return text;
});

const plantDiseaseAnalysisPrompt = ai.definePrompt({
  name: 'plantDiseaseAnalysisPrompt',
  tools: [generateSolution],
  input: {schema: RetryPlantDiseaseAnalysisInputSchema},
  output: {schema: RetryPlantDiseaseAnalysisOutputSchema},
  prompt: `You are an expert in plant diseases. Analyze the image and description to predict the plant disease. Use the generateSolution tool to provide treatment steps and preventive measures.

  Description: {{{{previousDiagnosis}}}}

  Photo: {{media url=photoDataUri}}
  `,
});

const retryPlantDiseaseAnalysisFlow = ai.defineFlow(
  {
    name: 'retryPlantDiseaseAnalysisFlow',
    inputSchema: RetryPlantDiseaseAnalysisInputSchema,
    outputSchema: RetryPlantDiseaseAnalysisOutputSchema,
  },
  async input => {
    const {output} = await plantDiseaseAnalysisPrompt(input);
    return output!;
  }
);
