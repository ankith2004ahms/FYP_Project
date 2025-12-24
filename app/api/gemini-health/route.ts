import { NextRequest, NextResponse } from 'next/server';
import { sendRawGeminiRequest } from '@/utils/gemini';

export async function GET(req: NextRequest) {
  try {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const requestBody = {
      contents: [{ parts: [{ text: 'Health check: respond with simple text "ok"' }] }],
      generationConfig: { temperature: 0.0, maxOutputTokens: 16 }
    };

    const meta = await sendRawGeminiRequest(requestBody, model);

    // Return only safe diagnostics (no keys or full body dumps). Show small snippet (first 200 chars).
    const snippet = (meta?.textBody || '').slice(0, 200);

    return NextResponse.json({ ok: true, status: meta?.status || null, contentType: meta?.headers?.['content-type'] || null, snippet });
  } catch (err) {
    const structured: any = { message: String(err?.message || err), stack: err?.stack || null };
    if ((err as any).status) structured.status = (err as any).status;
    if ((err as any).headers) structured.headers = (err as any).headers;
    return NextResponse.json({ ok: false, error: structured }, { status: 500 });
  }
}

export const config = { runtime: 'edge' };
