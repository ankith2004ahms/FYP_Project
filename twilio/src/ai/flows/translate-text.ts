'use server';
/**
 * @fileOverview Translates text to a specified language.
 *
 * - translateText - A function that handles the text translation.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.union([z.string(), z.array(z.string())]).describe('The text to translate.'),
  targetLanguage: z.string().describe('The target language (e.g., "Spanish", "French").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translation: z.union([z.string(), z.array(z.string())]).describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const translateTextPrompt = ai.definePrompt(
  {
    name: 'translateTextPrompt',
    input: { schema: TranslateTextInputSchema },
    output: { schema: TranslateTextOutputSchema },
    prompt: `Translate the following text to {{targetLanguage}}.
    
    If the input is an array, translate each element and return an array.
    If the input is a string, return a translated string.

    Text:
    {{{text}}}
    `,
  }
);

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async input => {
    if ((Array.isArray(input.text) && input.text.length === 0) || !input.text) {
      return { translation: input.text };
    }
    const {output} = await translateTextPrompt(input);
    return output!;
  }
);
