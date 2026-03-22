import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { mkdir } from 'fs/promises';

type PythonPrediction = {
  disease: string;
  confidence: number;
  class_index?: number;
  date?: string;
};

async function runPythonPredict(imageBase64: string): Promise<PythonPrediction> {
  const pythonScript = path.join(process.cwd(), 'scripts', 'predict.py');

  let pythonCmd = process.env.PYTHON_PATH;
  if (!pythonCmd) {
    const venvPython =
      process.platform === 'win32'
        ? path.join(process.cwd(), '.venv', 'Scripts', 'python.exe')
        : path.join(process.cwd(), '.venv', 'bin', 'python');
    pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python';
  }

  const envForPython = {
    ...process.env,
    TF_ENABLE_ONEDNN_OPTS: process.env.TF_ENABLE_ONEDNN_OPTS ?? '0',
    PREDICT_MODEL_FILE: process.env.PREDICT_MODEL_FILE ?? 'my_cnn_model.h5'
  };

  return await new Promise<PythonPrediction>((resolve, reject) => {
    const python = spawn(pythonCmd!, [pythonScript], { stdio: ['pipe', 'pipe', 'pipe'], env: envForPython });
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

    python.on('close', (code) => {
      const out = stdout.trim();
      const errOut = stderr.trim();

      if (code !== 0) {
        return reject(new Error(`Python exited with code ${code}\nSTDERR:\n${errOut}\nSTDOUT:\n${out}`));
      }

      if (!out) {
        return reject(new Error(`No output from Python script\nSTDERR:\n${errOut}`));
      }

      try {
        let parsed: PythonPrediction & { error?: string };
        try {
          parsed = JSON.parse(out);
        } catch (e) {
          const matches = out.match(/\{[\s\S]*?\}/g);
          if (!matches?.length) throw e;
          parsed = JSON.parse(matches[matches.length - 1]);
        }

        if (parsed.error) {
          return reject(new Error(`${parsed.error}\n${JSON.stringify({ stderr: errOut })}`));
        }

        resolve(parsed);
      } catch (e) {
        return reject(new Error(`Failed to parse Python output: ${e instanceof Error ? e.message : String(e)}\nSTDOUT:\n${out}\nSTDERR:\n${errOut}`));
      }
    });
  });
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

    console.log('Starting disease detection with CNN model...');
    const prediction = await runPythonPredict(imageBase64);
    console.log('CNN disease prediction:', prediction);

    return NextResponse.json({
      disease: prediction.disease,
      displayName: prediction.disease,
      confidence: Math.round((prediction.confidence || 0) * 10000) / 100,
      date: prediction.date || new Date().toISOString(),
      language,
      source: 'cnn'
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
