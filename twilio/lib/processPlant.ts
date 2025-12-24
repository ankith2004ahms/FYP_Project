import { Buffer } from 'buffer';

type Args = {
  language: string;
  mediaUrls: string[];
  twilioAuth: { accountSid: string; authToken: string };
};

export async function processPlant({ language, mediaUrls, twilioAuth }: Args): Promise<string> {
  console.log('[processPlant] start', { language, mediaUrlsLength: mediaUrls?.length });

  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error('No media URL provided');
  }

  const mediaUrl = mediaUrls[0];
  console.log('[processPlant] fetching media', mediaUrl);

  if (typeof fetch === 'undefined') {
    throw new Error('fetch is not available in this runtime. Use Node 18+ or install node-fetch.');
  }

  // fetch media from Twilio (basic auth)
  const basicAuth = Buffer.from(`${twilioAuth.accountSid}:${twilioAuth.authToken}`).toString('base64');
  const mediaRes = await fetch(mediaUrl, { headers: { Authorization: `Basic ${basicAuth}` } });
  if (!mediaRes.ok) {
    const bodyText = await mediaRes.text().catch(() => '<no body>');
    console.error('[processPlant] media fetch failed', { status: mediaRes.status, bodyText });
    throw new Error(`Failed to fetch media: ${mediaRes.status} ${mediaRes.statusText}`);
  }
  const arrayBuffer = await mediaRes.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString('base64');
  
  // Detect image format from content type
  const contentType = mediaRes.headers.get('content-type') || 'image/jpeg';
  const mimeType = contentType.startsWith('image/') ? contentType : 'image/jpeg';

  // GEMINI config from env
  const configuredUrl = process.env.GEMINI_API_URL || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';
  console.log('[processPlant] gemini config', { configuredUrl, hasKey: !!geminiKey });

  if (!geminiKey) {
    return `(demo) Received image and language "${language}". Gemini API key missing.`;
  }

  // First, let's discover what models are available for this API key
  let finalUrl = '';
  const modelsListUrl = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(geminiKey)}`;
  
  try {
    console.log('[processPlant] discovering available models...');
    const mdlRes = await fetch(modelsListUrl);
    if (mdlRes.ok) {
      const mdlJson = await mdlRes.json();
      const models = Array.isArray(mdlJson.models) ? mdlJson.models : [];
      console.log('[processPlant] available models:', models.map((m: any) => m.name).slice(0, 10));
      
      // Look for a suitable model that supports generateContent
      const suitableModel = models.find((m: any) => {
        const name = m.name || '';
        const methods = m.supportedGenerationMethods || [];
        return (name.includes('gemini') || name.includes('text-bison')) && 
               (methods.includes('generateContent') || methods.includes('generate'));
      });
      
      if (suitableModel) {
        const modelName = suitableModel.name.replace('models/', '');
        finalUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${encodeURIComponent(geminiKey)}`;
        console.log('[processPlant] using discovered model:', modelName);
      }
    }
  } catch (e) {
    console.warn('[processPlant] failed to discover models:', e);
  }
  
  // Fallback to common model names if discovery failed
  if (!finalUrl) {
    const fallbackModels = [
      { name: 'gemini-1.5-flash', useNewFormat: true },
      { name: 'gemini-1.5-pro', useNewFormat: true },
      { name: 'gemini-pro', useNewFormat: true },
      { name: 'text-bison-001', useNewFormat: false }
    ];
    
    // Use the first fallback model (we can't actually test without making a request)
    const fallbackModel = fallbackModels[0];
    const endpoint = fallbackModel.useNewFormat ? 'generateContent' : 'generate';
    finalUrl = `https://generativelanguage.googleapis.com/v1/models/${fallbackModel.name}:${endpoint}?key=${encodeURIComponent(geminiKey)}`;
    console.log('[processPlant] using fallback model:', fallbackModel.name, 'format:', endpoint);
  }
  
  if (!finalUrl) {
    throw new Error('No suitable Gemini model found. Please check your API key and available models.');
  }

  // Build prompt for the new Gemini API format
  const promptText = [
    `You are a plant identification assistant.`,
    `Language: ${language}`,
    `Task: Identify the plant from the provided image and give short care tips in ${language}.`
  ].join('\n');

  console.log('[processPlant] calling gemini', { url: finalUrl });
  
  // Determine if we should use the new format (generateContent) or old format (generate)
  const isNewFormat = finalUrl.includes('generateContent');
  let requestBody;
  
  if (isNewFormat) {
    // New Gemini API format
    requestBody = {
      contents: [{
        parts: [
          {
            text: promptText
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      }
    };
  } else {
    // Old format for text-bison models (note: these don't support images directly)
    // We'll include the image as base64 in the text prompt
    const promptWithImage = [
      promptText,
      `\nImage data (base64): ${base64Image.slice(0, 1000)}...` // Truncate for text models
    ].join('\n');
    
    requestBody = {
      prompt: { text: promptWithImage },
      temperature: 0.2,
      maxOutputTokens: 2048,
    };
  }
  
  const resp = await fetch(finalUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  console.log('[processPlant] gemini status', resp.status);
  const textBody = await resp.text().catch(() => '');
  if (!resp.ok) {
    console.error('[processPlant] gemini failed', { status: resp.status, textBody });
    throw new Error(`Gemini service error: ${resp.status} ${textBody}`);
  }

  const json = JSON.parse(textBody || '{}');
  console.log('[processPlant] gemini response', json);
  
  // Parse response based on format
  if (isNewFormat) {
    // New Gemini API response format
    const candidate = json?.candidates?.[0];
    if (candidate?.content?.parts?.[0]?.text) {
      return candidate.content.parts[0].text;
    }
    
    // Check if response was truncated due to max tokens
    if (candidate?.finishReason === 'MAX_TOKENS') {
      return `Response was truncated due to token limit. Please try with a shorter prompt or higher token limit.`;
    }
    
    // If no text content found, try to extract any available text
    if (candidate?.content?.parts) {
      const textParts = candidate.content.parts.filter((part: any) => part.text);
      if (textParts.length > 0) {
        return textParts.map((part: any) => part.text).join('\n');
      }
    }
  } else {
    // Old format response
    const candidate = json?.candidates?.[0]?.content || json?.candidates?.[0]?.text;
    if (typeof candidate === 'string') return candidate;
  }
  
  // Fallback for other response formats
  if (typeof json.result === 'string') return json.result;
  if (typeof json.output === 'string') return json.output;
  
  // If we get here, log the response structure for debugging
  console.error('[processPlant] unexpected response structure:', JSON.stringify(json, null, 2));
  return `Sorry, I received an unexpected response format from the AI service. Please try again.`;
}
