'use server';

import { predictPlantDiseaseAndSuggestTreatment } from '@/ai/flows/predict-plant-disease-and-suggest-treatment';
import { retryPlantDiseaseAnalysis } from '@/ai/flows/retry-plant-disease-analysis';
import { z } from 'zod';
import { languages } from '@/lib/languages';


export type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: React.ReactNode;
  image?: string;
  isSaving?: boolean;
};


type FormState = {
  success: boolean;
  error?: string;
  data?: any;
} | null;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const imageSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, 'Please select an image.')
  .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    'Only .jpg, .jpeg, .png and .webp formats are supported.'
  );

async function fileToDataUri(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${file.type};base64,${base64}`;
}

export async function analyzePlantImage(prevState: FormState, formData: FormData): Promise<FormState> {
  const file = formData.get('image');
  
  const validatedFile = imageSchema.safeParse(file);
  if (!validatedFile.success) {
    return { success: false, error: validatedFile.error.flatten().formErrors.join(', ') };
  }

  try {
    const photoDataUri = await fileToDataUri(validatedFile.data);
    const result = await predictPlantDiseaseAndSuggestTreatment({ photoDataUri });
    return { success: true, data: { ...result, photoDataUri } };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to analyze the image. ${errorMessage}` };
  }
}

export async function retryAnalysisAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const photoDataUri = formData.get('photoDataUri') as string;
  const previousDiagnosis = formData.get('previousDiagnosis') as string;

  if (!photoDataUri || !previousDiagnosis) {
    return { success: false, error: 'Missing information for retry.' };
  }
  
  try {
    const result = await retryPlantDiseaseAnalysis({ photoDataUri, previousDiagnosis });
    const mappedResult = {
      disease: result.diseasePrediction,
      treatment: result.solution,
    };
    return { success: true, data: { ...mappedResult, photoDataUri } };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to retry analysis. ${errorMessage}` };
  }
}

export async function sendMessage(messages: Message[], formData: FormData) {
  'use server'
  const file = formData.get('image')
  const languageCode = formData.get('language') as string || 'en';
  const targetLanguage = languages.find(l => l.code === languageCode)?.name || 'English';

  if (!file || !(file instanceof File) || file.size === 0) {
    return [
      ...messages,
      {
        id: Date.now(),
        role: 'assistant',
        content: 'Please select an image to analyze.',
      } as Message,
    ]
  }

  const validatedFile = imageSchema.safeParse(file)
  if (!validatedFile.success) {
    return [
      ...messages,
      {
        id: Date.now(),
        role: 'assistant',
        content: validatedFile.error.flatten().formErrors.join(', '),
      } as Message,
    ]
  }

  const photoDataUri = await fileToDataUri(validatedFile.data)

  const userMessage: Message = {
    id: Date.now(),
    role: 'user',
    content: '',
    image: photoDataUri,
    isSaving: true,
  }

  try {
    const result = await predictPlantDiseaseAndSuggestTreatment({ photoDataUri, targetLanguage })
    return [
      ...messages,
      { ...userMessage, isSaving: false },
      {
        id: Date.now() + 1,
        role: 'assistant',
        content: result,
      },
    ]
  } catch (e) {
    console.error(e)
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.'
    return [
      ...messages,
      { ...userMessage, isSaving: false },
      {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry, an error occurred: ${errorMessage}`,
      },
    ]
  }
}
