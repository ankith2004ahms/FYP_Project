/**
 * Helper to call Google Generative Language (Gemini) with an image for disease identification.
 * Exports: predictDiseaseFromImage and PLANT_DISEASE_CLASSES
 *
 * This version forces Gemini to reply with a single disease NAME (plain text) chosen from the
 * provided canonical list of 38 classes. If the model returns something else, we map it to the
 * closest class from the list.
 */

export const PLANT_DISEASE_CLASSES = [
  "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
  "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
  "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_",
  "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy", "Grape___Black_rot",
  "Grape___Esca_(Black_Measles)", "Grape___healthy", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
  "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
  "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy", "Potato___Early_blight",
  "Potato___Late_blight", "Potato___healthy", "Raspberry___healthy", "Soybean___healthy",
  "Squash___Powdery_mildew", "Strawberry___Leaf_scorch", "Strawberry___healthy",
  "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
  "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
  "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
  "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy"
];

function normalizeName(s: string) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .replace(/_{2,}/g, '_')
    .trim();
}

function levenshtein(a: string, b: string) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

// Map simple language keys used in the UI to BCP-47 Accept-Language tags
function mapLanguageToBCP47(lang: string) {
  if (!lang) return 'en';
  const key = String(lang).trim().toLowerCase();
  const map: Record<string, string> = {
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
  return map[key] || 'en';
}

/**
 * Send a raw request body to Gemini's generateContent endpoint and return metadata.
 * Returns { textBody, status, headers } where headers contains content-type if available.
 */
export async function sendRawGeminiRequest(requestBody: any, modelName = 'gemini-2.5-flash', headersExtra?: Record<string,string>) {
  const geminiKey = 'AIzaSyAT6hEEHNrlt9M1Z_aLNYGwNjTj4biUOh8';
  const configuredUrl = process.env.GEMINI_API_URL || '';
  if (!geminiKey) {
    throw new Error('Gemini API key missing (set GEMINI_API_KEY in .env)');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(modelName)}:generateContent${geminiKey ? `?key=${encodeURIComponent(geminiKey)}` : ''}`;

  let urlToUse = configuredUrl && configuredUrl.trim() ? configuredUrl : endpoint;

  if (configuredUrl && configuredUrl.trim()) {
    try {
      // validate
      // eslint-disable-next-line no-new
      new URL(urlToUse);
    } catch (err) {
      if (/^AIza[a-zA-Z0-9_-]{10,}/.test(urlToUse)) {
        console.warn('GEMINI_API_URL appears to contain an API key instead of a URL. Falling back to default endpoint. Please set GEMINI_API_KEY for the key and GEMINI_API_URL to a proper URL if needed.');
      } else {
        console.warn('Configured GEMINI_API_URL is not a valid URL. Falling back to default endpoint. Value omitted from logs for safety.');
      }
      urlToUse = endpoint;
    }
  }

  // Build headers safely. Support Bearer token if provided in GEMINI_BEARER_TOKEN. Ensure charset and Accept header are present.
  const headers: Record<string, string> = { 'Content-Type': 'application/json; charset=utf-8', 'Accept': 'application/json' };
  const bearer = process.env.GEMINI_BEARER_TOKEN;
  if (bearer && bearer.trim()) {
    headers['Authorization'] = `Bearer ${bearer.trim()}`;
    // If using Bearer token, remove key param from urlToUse for cleanliness if present
    try {
      const u = new URL(urlToUse);
      u.searchParams.delete('key');
      urlToUse = u.toString();
    } catch (_) {
      // ignore
    }
  }

  // Merge any extra headers (e.g., Accept-Language)
  if (headersExtra) {
    for (const [k, v] of Object.entries(headersExtra)) {
      if (v && v.trim()) headers[k] = v.trim();
    }
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    const logUrl = (urlToUse || '').startsWith('http') ? urlToUse : '[non-URL configured value omitted]';
    console.debug(`Gemini request attempt=${attempt} url=${logUrl}`);

    let resp;
    try {
      resp = await fetch(urlToUse, { method: 'POST', headers, body: JSON.stringify(requestBody) });
    } catch (networkErr) {
      const e = new Error(`Network error calling Gemini: ${String(networkErr)}`);
      (e as any).original = networkErr;
      throw e;
    }

    const textBody = await resp.text().catch(() => '');

    if (!resp.ok) {
      let parsedErrBody: any = textBody;
      try {
        parsedErrBody = JSON.parse(textBody || '{}');
      } catch (_) {}

      const err = new Error(`Gemini API error ${resp.status}: ${typeof parsedErrBody === 'string' ? parsedErrBody : JSON.stringify(parsedErrBody)}`);
      (err as any).status = resp.status;
      (err as any).body = parsedErrBody;

      if ((resp.status === 429 || resp.status === 503) && attempt < 3) {
        const backoff = Math.pow(2, attempt) * 250;
        console.warn(`Gemini rate/service error, retrying after ${backoff}ms (attempt ${attempt})`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      throw err;
    }

    return { textBody, status: resp.status, headers: { 'content-type': resp.headers?.get?.('content-type') || null } };
  }

  throw new Error('Failed to get response from Gemini after retries');
}

export type GeminiPrediction = {
  disease: string;
  date?: string;
  raw?: any;
  displayName?: string;
};

export async function predictDiseaseFromImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  modelName = 'gemini-2.5-flash',
  language = 'english'
): Promise<GeminiPrediction> {
  const geminiKey = 'AIzaSyAT6hEEHNrlt9M1Z_aLNYGwNjTj4biUOh8';
  const configuredUrl = process.env.GEMINI_API_URL || '';
  if (!geminiKey) {
    throw new Error('Gemini API key missing');
  }

  // Build endpoint URL for generateContent
  const finalModel = modelName;
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(finalModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`;

  // Build a strict prompt that lists the allowed classes and instructs Gemini to respond with ONLY
  // the exact disease NAME from the list (one line, no JSON, no punctuation, no extra text).
  const instruction = `You are an agricultural expert. Analyze the provided plant image and identify the disease.\n` +
    `IMPORTANT: Respond with exactly ONE token: the disease NAME (plain text) and it must be strictly in the ${language} language that the user requested and it MUST be one of the following canonical classes (do not change casing or punctuation):\n\n` +
    /* (canonical class list omitted to keep prompt short) */ +
    `\n\nIf you are not certain, still choose the single most likely class from the list. Do NOT return JSON, percentages, explanations, or any other text — only the single disease name from the list.`;

  const promptText = [`Language: ${language}`, `Task: Identify the plant disease present in the image.`, instruction].join('\n\n');

  const requestBody = {
    contents: [{
      parts: [
        { text: promptText },
        { inline_data: { mime_type: mimeType, data: imageBase64 } }
      ]
    }],
    generationConfig: {
      temperature: 0.0,
      maxOutputTokens: 64
    }
  };

  // Send the request using the shared helper
  let responseMeta = await sendRawGeminiRequest(requestBody, modelName);
  console.log(responseMeta);
  let textBody = responseMeta?.textBody || '';

  // Debug log: status and content-type can help diagnose empty responses
  console.debug('Gemini response status=', responseMeta?.status, 'content-type=', responseMeta?.headers?.['content-type']);

  let json: any = {};
  try {
    json = JSON.parse(textBody || '{}');
  } catch (e) {
    // Not a JSON response (some Gemini outputs are JSON embedded in text). We'll extract candidate text below.
    json = { rawText: textBody };
  }

  // Extract text from new format if present
  const isNewFormat = textBody.includes('candidates') || (json && json.candidates);
  let candidateText = '';
  if (isNewFormat) {
    try {
      const parsed = typeof json === 'object' ? json : JSON.parse(textBody || '{}');
      const candidate = parsed?.candidates?.[0];
      if (candidate) {
        // candidate.content.parts may contain text parts
        const parts = (candidate.content?.parts || []).filter((p: any) => p.text).map((p: any) => p.text);
        candidateText = parts.join('\n') || '';
      }
    } catch (e) {
      // ignore
    }
  }

  // If candidate was present but contained no text and finished due to MAX_TOKENS, retry once with larger output budget
  try {
    const parsedCheck = typeof json === 'object' ? json : JSON.parse(textBody || '{}');
    const candCheck = parsedCheck?.candidates?.[0];
    if (candCheck && (candCheck.finishReason === 'MAX_TOKENS' || candCheck.finishReason === 'INCOMPLETE') && (!candidateText || candidateText.trim() === '')) {
      console.warn('Gemini candidate finished with MAX_TOKENS and no text — retrying with larger maxOutputTokens');
      const retryBody = JSON.parse(JSON.stringify(requestBody));
      retryBody.generationConfig = retryBody.generationConfig || {};
      retryBody.generationConfig.maxOutputTokens = Math.max(128, (retryBody.generationConfig.maxOutputTokens || 64) * 2);
      const retryResponseMeta = await sendRawGeminiRequest(retryBody, modelName);
      const retryTextBody = retryResponseMeta?.textBody || '';
      try {
        json = JSON.parse(retryTextBody || '{}');
      } catch (e) {
        json = { rawText: retryTextBody };
      }

      const parsed2 = typeof json === 'object' ? json : JSON.parse(retryTextBody || '{}');
      const candidate2 = parsed2?.candidates?.[0];
      if (candidate2) {
        const parts2 = (candidate2.content?.parts || []).filter((p: any) => p.text).map((p: any) => p.text);
        candidateText = parts2.join('\n') || '';
      }
    }
  } catch (e) {
    // ignore retry errors and proceed to fallback
  }

  // If we couldn't extract via JSON, try to use raw textBody
  const responseText = candidateText || (json?.result || json?.output || json?.text) || (json?.rawText) || '';

  // Try to parse a JSON blob from the response text (unlikely since we insist on plain text), but handle it.
  const jsonMatch = (responseText || '').match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsedObj = JSON.parse(jsonMatch[0]);
      const disease = parsedObj.disease || parsedObj.disease_name || parsedObj.label || '';
      const date = parsedObj.date || new Date().toISOString();
      if (!disease) throw new Error('Parsed JSON had no disease field');
      // Map to canonical classes below
      const mapped = mapToCanonicalClass(disease);
      return { disease: mapped, date, raw: parsedObj };
    } catch (e) {
      // fallthrough to text parse
    }
  }

  // As fallback, try to extract a disease name from free text: look for the first line
  const freeText = (responseText || '').trim();
  if (!freeText) {
    const e = new Error('Empty response from Gemini');
    (e as any).status = responseMeta?.status;
    (e as any).headers = responseMeta?.headers;
    (e as any).body = responseMeta?.textBody || null;
    throw e;
  }

  // Heuristic: take first non-empty line and trim possible punctuation
  const firstLine = freeText.split('\n').map((l: string) => l.trim()).find((l: string) => l.length > 0) || freeText;
  // remove leading labels like "Disease:" or "Diagnosis:"
  const cleanedLine = (firstLine as string).replace(/^(Disease|Diagnosis|Identified)[:\-\s]+/i, '').replace(/[\.:]$/,'').replace(/^\"|\"$/g,'').trim();

  // Attempt to parse the CANONICAL || TRANSLATED format
  let canonicalText = cleanedLine;
  let localized = '';
  if (cleanedLine.includes('||')) {
    const parts = cleanedLine.split('||').map((p) => p.trim());
    if (parts.length >= 2) {
      canonicalText = parts[0] || canonicalText;
      localized = parts.slice(1).join(' || ');
    }
  } else {
    // also support a common pattern: CANONICAL_NAME (Translated Name)
    const parenMatch = cleanedLine.match(/^(.+?)\s*\((.+)\)\s*$/);
    if (parenMatch) {
      canonicalText = parenMatch[1].trim();
      localized = parenMatch[2].trim();
    }
  }

  const mapped = mapToCanonicalClass(canonicalText);
  const displayName = localized || mapped;

  return { disease: mapped, date: new Date().toISOString(), raw: { text: freeText, original: cleanedLine }, displayName };

  // helper to map arbitrary model text to one of the canonical classes
  function mapToCanonicalClass(text: string) {
    const normalizedCandidate = normalizeName(text);
    let bestMatch = PLANT_DISEASE_CLASSES[0];
    let bestScore = Infinity;
    for (const cls of PLANT_DISEASE_CLASSES) {
      const n = normalizeName(cls);
      if (n === normalizedCandidate) {
        bestMatch = cls;
        bestScore = 0;
        break;
      }
      const d = levenshtein(n, normalizedCandidate);
      if (d < bestScore) {
        bestScore = d;
        bestMatch = cls;
      }
    }
    return bestMatch;
  }
}
