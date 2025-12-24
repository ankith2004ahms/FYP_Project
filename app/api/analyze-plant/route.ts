import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { mkdir } from 'fs/promises';
import { predictDiseaseFromImage } from '@/utils/gemini';
const ollama_model  = process.env.OLLAMA_MODEL;
const OLLAMA_BASE_URL = process.env.OLLAMA_HOST

export async function generateText(
  model: string = 'llama3',
  prompt: string,
  systemPrompt?: string,
  language: string = 'english'
): Promise<string> {
  try {
    const requestBody: any = {
      model: model,
      prompt: prompt,
      stream: false,
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    // Map UI language to BCP-47 Accept-Language values
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
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Accept-Language': acceptLang
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error calling Ollama API:', error);
    throw error;
  }
}


export async function POST(req: NextRequest) {
  try {
    const tempDir = path.join(process.cwd(), 'tmp');
    try {
      await mkdir(tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File;

    // accept language from form (e.g., "english", "hindi"), default to 'english'
    const langField = formData.get('language');
    const language =
      typeof langField === 'string' && langField.trim() ? langField.trim().toLowerCase() : 'english';

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }
    
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageBase64 = buffer.toString('base64');

    // Use Ollama LLM to predict the disease directly from the image (JSON output expected)
    // Prefer the configured OLLAMA_MODEL or fall back to llama3.2:1b
    const modelToUse = ollama_model || 'llama3.2:1b';

    let result: any;
    let source = 'unknown';

    // helper to run the legacy Python model as a fallback
    const runPythonPredict = async (imageBase64: string) => {
      const pythonScript = path.join(process.cwd(), 'scripts', 'predict.py');

      let pythonCmd = process.env.PYTHON_PATH;
      if (!pythonCmd) {
        const venvPython =
          process.platform === 'win32'
            ? path.join(process.cwd(), '.venv', 'Scripts', 'python.exe')
            : path.join(process.cwd(), '.venv', 'bin', 'python');
        pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python';
      }

      const envForPython = { ...process.env, TF_ENABLE_ONEDNN_OPTS: process.env.TF_ENABLE_ONEDNN_OPTS ?? '0' };

      return await new Promise<any>((resolve, reject) => {
        const python = spawn(pythonCmd, [pythonScript], { stdio: ['pipe', 'pipe', 'pipe'], env: envForPython });
        let stdout = '';
        let stderr = '';

        python.stdin.write(imageBase64);
        python.stdin.end();

        python.stdout.on('data', (chunk) => {
          const s = chunk.toString();
          stdout += s;
          console.log('[predict.py stdout]', s);
        });

        python.stderr.on('data', (chunk) => {
          const s = chunk.toString();
          stderr += s;
          console.warn('[predict.py stderr]', s);
        });

        python.on('error', (err) => reject(new Error(`Failed to start Python process: ${err.message}`)));

        python.on('close', async (code) => {
          const out = stdout.trim();
          const errOut = stderr.trim();

          if (code !== 0) {
            return reject(new Error(`Python exited with code ${code}\nSTDERR:\n${errOut}\nSTDOUT:\n${out}`));
          }

          if (!out) {
            return reject(new Error(`No output from Python script\nSTDERR:\n${errOut}`));
          }

          try {
            // First try straightforward JSON parse
            let parsed: any;
            try {
              parsed = JSON.parse(out);
            } catch (e) {
              // If multiple JSON objects or prepended logs are present, try to extract the last JSON object in stdout
              const matches = out.match(/\{[\s\S]*?\}/g);
              if (matches && matches.length > 0) {
                const last = matches[matches.length - 1];
                try {
                  parsed = JSON.parse(last);
                } catch (innerErr) {
                  throw new Error(`Failed to parse extracted JSON: ${innerErr instanceof Error ? innerErr.message : String(innerErr)}`);
                }
              } else {
                throw e;
              }
            }

            if (parsed.error) return reject(new Error(parsed.error + '\n' + JSON.stringify({ stderr: errOut })));
            resolve(parsed);
          } catch (e) {
            return reject(new Error(`Failed to parse Python output: ${e instanceof Error ? e.message : String(e)}\nSTDOUT:\n${out}\nSTDERR:\n${errOut}`));
          }
        });
      });
    };

    try {
      // Decide whether to call Gemini or fallback based on connectivity and responsiveness
      const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const GEMINI_WAIT_MS = 7500; // wait/timeout threshold in milliseconds (7.5s)

      // helper: short delay
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

      // helper: simple connectivity check (fast)
      const isInternetAvailable = async (timeoutMs = 1500) => {
        try {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeoutMs);
          // use a lightweight URL that responds with 204
          const resp = await fetch('https://clients3.google.com/generate_204', { method: 'GET', signal: controller.signal });
          clearTimeout(id);
          return resp && resp.status === 204;
        } catch (e) {
          return false;
        }
      };

      const internet = await isInternetAvailable();

      if (!internet) {
        console.warn('No internet connectivity detected. Using local model fallback immediately.');
        try {
          result = await runPythonPredict(imageBase64);
          source = 'python';
          console.log('Fallback prediction from Python (no internet) succeeded');
        } catch (pyErr) {
          console.error('Python fallback failed (no internet):', pyErr);
          return NextResponse.json({ error: 'Failed to get disease prediction from offline model', details: String(pyErr) }, { status: 500 });
        }
      } else {
        // Internet present — attempt Gemini but with a timeout; if no response within GEMINI_WAIT_MS, fallback to Python
        console.debug('Internet available; attempting Gemini model:', geminiModel);

        try {
          const geminiPromise = predictDiseaseFromImage(imageBase64, imageFile.type || 'image/jpeg', geminiModel, language);
          const timeoutPromise = new Promise((_res, reject) => setTimeout(() => reject(new Error('Gemini timeout')), GEMINI_WAIT_MS));
          result = await Promise.race([geminiPromise, timeoutPromise]) as any;
          source = 'gemini';
        } catch (gemErr) {
          console.error('Gemini call failed or timed out:', gemErr);
          // Log structured info if available
          const structured: any = {};
          if (gemErr instanceof Error) {
            structured.message = gemErr.message;
            structured.stack = gemErr.stack;
            structured.status = (gemErr as any).status;
            structured.headers = (gemErr as any).headers || null;
            structured.body = (gemErr as any).body || (gemErr as any).original || null;
          }
          console.error('Gemini structured error (race):', structured);

          // Try python fallback after Gemini failure/timeouts
          try {
            console.warn('Falling back to local Python model due to Gemini failure/timeout');
            result = await runPythonPredict(imageBase64);
            source = 'python';
            console.log('Fallback prediction from Python succeeded');
          } catch (pyErr) {
            console.error('Python fallback also failed:', pyErr);
            // Return combined error info for easier debugging
            return NextResponse.json({ error: 'Failed to get disease prediction from Gemini and Python fallback', details: `${String(gemErr)} | Python: ${String(pyErr)}` }, { status: 500 });
          }
        }
      }

      // Minimal validation
      if (!result || !result.disease) {
        throw new Error('Model did not return a disease name');
      }
    } catch (err) {
      console.error('Error getting prediction and fallback handling:', err);
      return NextResponse.json({ error: 'Failed to get disease prediction', details: String(err) }, { status: 500 });
    }
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Map the returned disease to one of our canonical classes to ensure UI displays only allowed classes
    try {
      const mod = await import('@/utils/gemini');
      const classes: string[] = mod.PLANT_DISEASE_CLASSES || [];

      function normalize(s: string) {
        return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
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

      const candidate = String(result.disease || '');
      const normalizedCandidate = normalize(candidate);
      let best = classes[0] || candidate;
      let bestScore = Infinity;
      for (const cls of classes) {
        const n = normalize(cls);
        if (n === normalizedCandidate) {
          best = cls;
          bestScore = 0;
          break;
        }
        const d = levenshtein(n, normalizedCandidate);
        if (d < bestScore) {
          bestScore = d;
          best = cls;
        }
      }
      result.disease = best;
    } catch (e) {
      // mapping failed, keep original
    }

    // Return disease name, displayName (localized if available), and source so UI can handle delays and translations
    return NextResponse.json({
      disease: result.disease,
      displayName: (result as any).displayName || result.disease,
      date: result.date || new Date().toISOString(),
      language,
      source
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process the image', details: String(error) },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
};