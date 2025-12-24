/**
 * Utility functions for interacting with the Ollama API
 */

// Base URL for Ollama API
const OLLAMA_BASE_URL = 'http://localhost:11434';

/**
 * Generate text using the Ollama API
 * @param model The model to use (e.g., 'llama3')
 * @param prompt The prompt to send to the model
 * @param systemPrompt The optional system prompt to guide the model's behavior
 * @returns The generated text
 */
// Helper: fetch with timeout using AbortController (configurable via OLLAMA_FETCH_TIMEOUT_MS; defaults to 120s)
const DEFAULT_OLLAMA_FETCH_TIMEOUT_MS = Number(process.env.OLLAMA_FETCH_TIMEOUT_MS || '120000');
async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = DEFAULT_OLLAMA_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const merged = { ...(init || {}), signal: controller.signal } as RequestInit;
    const resp = await fetch(input, merged);
    clearTimeout(id);
    return resp;
  } catch (err: any) {
    clearTimeout(id);
    // Map AbortError/timeout cases to a clearer timeout error message for upstream handling
    if (err && (err.name === 'AbortError' || String(err).toLowerCase().includes('timed out') || String(err).toLowerCase().includes('timeout') || String(err).toLowerCase().includes('aborted'))) {
      throw new Error(`Request to ${String(input)} aborted after ${timeoutMs}ms`);
    }
    throw err;
  }
}

// lightweight health check for Ollama
export async function isOllamaAvailable(timeoutMs = 3000) {
  try {
    const resp = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/tags`, { method: 'GET' }, timeoutMs);
    if (!resp.ok) throw new Error(`Ollama health check returned status ${resp.status}`);
    return true;
  } catch (err) {
    return false;
  }
}

export async function generateText(
  model: string = 'llama3.2:1b',
  prompt: string,
  systemPrompt?: string,
  language: string = 'english'
): Promise<string> {
  // simple mapping to BCP-47 Accept-Language values
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

  const requestBody: any = {
    model: model,
    prompt: prompt,
    stream: false,
  };

  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  // Quick availability check before attempting long operations
  const alive = await isOllamaAvailable(3000);
  if (!alive) {
    throw new Error(`Ollama daemon appears unreachable at ${OLLAMA_BASE_URL}`);
  }

  // Try a few times for transient network errors (HeadersTimeoutError / fetch failed)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
          'Accept-Language': acceptLang
        },
        body: JSON.stringify(requestBody),
      }, DEFAULT_OLLAMA_FETCH_TIMEOUT_MS);

      if (!response.ok) {
        // read body for debugging
        let bodyText = '';
        try { bodyText = await response.text(); } catch (_) { /* ignore */ }
        console.error(`Ollama API error: ${response.status} - ${bodyText}`);
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (err: any) {
      const isLast = attempt === 3;
      console.error(`Error calling Ollama API (attempt ${attempt}):`, err);
      // If this looks like a server not running issue, give a clearer message
      if (err && err.code === 'UND_ERR_HEADERS_TIMEOUT') {
        const hint = `Ollama server headers timeout at ${OLLAMA_BASE_URL}. Is the Ollama daemon running and reachable?`;
        console.error(hint);
        if (isLast) throw new Error(`${hint} Original error: ${String(err)}`);
      }
      if (
        err instanceof TypeError ||
        String(err).toLowerCase().includes('fetch failed') ||
        String(err).toLowerCase().includes('networkerror') ||
        String(err).toLowerCase().includes('aborted') ||
        err.name === 'AbortError' ||
        String(err).toLowerCase().includes('timed out') ||
        String(err).toLowerCase().includes('timeout')
      ) {
        const hint = `Network/timeout error contacting Ollama at ${OLLAMA_BASE_URL}. Ensure Ollama is running and accessible and increase ${'OLLAMA_FETCH_TIMEOUT_MS'} if needed.`;
        console.error(hint);
        if (isLast) throw new Error(`${hint} Original error: ${String(err)}`);
      }
      // exponential backoff before retry
      if (!isLast) await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }

  // Should not reach here
  throw new Error('Failed to generate text from Ollama');
}

/**
 * Generate text and parse it as JSON
 * @param model The model to use (e.g., 'llama3')
 * @param prompt The prompt to send to the model
 * @param systemPrompt The optional system prompt to guide the model's behavior
 * @returns The parsed JSON object
 */
export async function generateJSON<T>(
  model: string = 'llama3.2:1b',
  prompt: string,
  systemPrompt?: string,
  language: string = 'english'
): Promise<T> {
  try {
    const content = await generateText(model, prompt, systemPrompt, language);
    
    // Try to parse the response as JSON
    try {
      return JSON.parse(content) as T;
    } catch (parseError) {
      console.error('Error parsing Ollama response as JSON:', parseError);
      
      // Remove any markdown code block syntax if present
      let cleanedContent = content
        .replace(/```json\s+/g, '')  // Remove opening ```json tag
        .replace(/```\s*$/g, '')    // Remove closing ``` tag
        .trim();
      
      // Attempt to extract JSON from the cleaned response text
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as T;
        } catch (e) {
          console.error('Error parsing extracted JSON:', e);
        }
      }
      
      throw new Error('Failed to parse response as JSON');
    }
  } catch (error) {
    console.error('Error generating JSON with Ollama:', error);
    throw error;
  }
}

/**
 * Get a list of available models from the Ollama API
 * @returns Array of model names
 */
export async function listModels(): Promise<string[]> {
  try {
    const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/tags`, { method: 'GET' }, DEFAULT_OLLAMA_FETCH_TIMEOUT_MS);
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.models?.map((model: any) => model.name) || [];
  } catch (error) {
    console.error('Error listing Ollama models:', error);
    throw error;
  }
} 