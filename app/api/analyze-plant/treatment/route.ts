import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_BASE_URL = process.env.OLLAMA_HOST;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';

async function generateText(model: string, prompt: string, systemPrompt?: string, language: string = 'english') {
  try {
    const requestBody: any = { model, prompt, stream: false };
    if (systemPrompt) requestBody.system = systemPrompt;

    const langMap: Record<string,string> = {
      english: 'en',
      hindi: 'hi-IN',
      tamil: 'ta-IN',
      telugu: 'te-IN',
      kannada: 'kn-IN',
      malayalam: 'ml-IN',
      marathi: 'mr-IN',
      punjabi: 'pa-IN',
      gujarati: 'gu-IN',
      bengali: 'bn-IN',
      oriya: 'or-IN',
      odia: 'or-IN',
      assamese: 'as-IN'
    };
    const acceptLang = langMap[String(language).toLowerCase()] || 'en';

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Accept': 'application/json', 'Accept-Language': acceptLang },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);
    const data = await response.json();
    return data.response;
  } catch (e) {
    console.error('Error calling Ollama:', e);
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const disease = String(body?.disease || '').trim();
    const language = String(body?.language || 'english').trim().toLowerCase();

    if (!disease) {
      return NextResponse.json({ error: 'Missing disease name' }, { status: 400 });
    }

    // Validate disease against canonical list
    try {
      const mod = await import('@/utils/gemini');
      const classes: string[] = mod.PLANT_DISEASE_CLASSES || [];
      if (!classes.includes(disease)) {
        return NextResponse.json({ error: 'Disease not recognized' }, { status: 400 });
      }
    } catch (e) {
      // if we can't load classes, proceed anyway
    }

    const systemPrompt = `You are an agricultural expert specializing in plant diseases. Provide practical and actionable guidance.`;
    const prompt = `Provide concise, practical information about ${disease} covering: 1) Causes, 2) Common symptoms to look for, 3) Immediate steps to take now, and 4) Preventive measures and precautions. Keep the answer in ${language.toUpperCase()} and respond in plain text. Use short paragraphs or bullet points and avoid repeating the disease name at the top.`;

    const responseText = await generateText(OLLAMA_MODEL, prompt, `${systemPrompt} ALWAYS RESPOND IN ${language.toUpperCase()}.`, language);

    return NextResponse.json({ treatmentInfo: responseText });
  } catch (error) {
    console.error('Error generating treatment info:', error);
    return NextResponse.json({ error: 'Failed to generate treatment info', details: String(error) }, { status: 500 });
  }
}

export const config = { runtime: 'edge' };
