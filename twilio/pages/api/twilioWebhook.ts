// New file: webhook for incoming Twilio posts (respond with TwiML)
import type { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';
import { processPlant } from '../../lib/processPlant';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const client = twilio(accountSid, authToken);

// Simple in-memory session store (ephemeral). Use Redis or DB in production.
const sessions = new Map<string, { state: 'awaiting_language' | 'awaiting_image'; language?: string }>();

const LANG_OPTIONS = ['english', 'kannada', 'hindi', 'tamil', 'malayalam'];

function buildLanguagePrompt() {
  return (
    'Choose a language by replying with the number or name:\n' +
    LANG_OPTIONS.map((l, i) => `${i + 1}. ${l}`).join('\n')
  );
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end();
    }

    const from = req.body?.From || ''; // e.g. 'whatsapp:+919632208332'
    const incomingRaw = req.body?.Body || '';
    const incoming = String(incomingRaw).trim().toLowerCase();
    const numMedia = parseInt(String(req.body?.NumMedia || '0'), 10);

    console.log('[webhook] incoming', { from, incomingRaw, numMedia });

    const twiml = new twilio.twiml.MessagingResponse();

    const session = sessions.get(from);

    // New user or session lost -> ask language
    if (!session) {
      sessions.set(from, { state: 'awaiting_language' });
      twiml.message(buildLanguagePrompt());
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end(twiml.toString());
    }

    // Awaiting language selection
    if (session.state === 'awaiting_language') {
      let chosen: string | undefined;
      const idx = parseInt(incoming, 10);
      if (!Number.isNaN(idx) && idx >= 1 && idx <= LANG_OPTIONS.length) {
        chosen = LANG_OPTIONS[idx - 1];
      } else if (LANG_OPTIONS.includes(incoming)) {
        chosen = incoming;
      }

      if (!chosen) {
        console.log('[webhook] invalid language selection:', incoming);
        twiml.message('Invalid selection. ' + buildLanguagePrompt());
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        return res.end(twiml.toString());
      }

      sessions.set(from, { state: 'awaiting_image', language: chosen });
      twiml.message(`You selected "${chosen}". Please send a clear image of the plant now.`);
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end(twiml.toString());
    }

    // Awaiting image
    if (session.state === 'awaiting_image') {
      if (numMedia && numMedia > 0) {
        // Collect media URLs
        const mediaUrls: string[] = [];
        for (let i = 0; i < numMedia; i++) {
          const key = `MediaUrl${i}`;
          if (req.body?.[key]) mediaUrls.push(String(req.body[key]));
        }

        console.log('[webhook] received media urls', mediaUrls);

        // Ack to Twilio quickly
        twiml.message('Image received. Processing — I will reply when done.');
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());

        // Process asynchronously and send result using Twilio REST API
        (async () => {
          try {
            const lang = session.language || 'english';
            console.log('[webhook] start processing', { from, lang, mediaUrls });
            const resultText = await processPlant({
              language: lang,
              mediaUrls,
              twilioAuth: { accountSid, authToken },
            });
            console.log('[webhook] processing result', { from, resultText });

            // send result back to user
            try {
              const sent = await client.messages.create({
                from: twilioFrom,
                to: from,
                body: resultText,
              });
              console.log('[webhook] sent reply via REST API', sent.sid, sent.status);
            } catch (sendErr) {
              console.error('[webhook] failed to send result via REST API', sendErr);
              // If it's a rate limit error, don't log as error - just info
              if ((sendErr as any)?.code === 63038) {
                console.log('[webhook] Twilio daily message limit reached - cannot send result');
              }
            }
          } catch (err) {
            console.error('[webhook] processing error', err);
            const msg = (err as Error).message || String(err);
            try {
              await client.messages.create({
                from: twilioFrom,
                to: from,
                body: `Sorry, error processing the image: ${msg}`,
              });
            } catch (sendErr) {
              console.error('[webhook] failed to send error message via REST API', sendErr);
              // If it's a rate limit error, don't log as error - just info
              if ((sendErr as any)?.code === 63038) {
                console.log('[webhook] Twilio daily message limit reached - cannot send error message');
              }
            }
          } finally {
            sessions.delete(from);
          }
        })();

        return;
      }

      // no media yet
      twiml.message('No image detected. Please send a clear photo of the plant.');
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end(twiml.toString());
    }

    // default fallback
    twiml.message('Unexpected state. Let\'s start over. ' + buildLanguagePrompt());
    sessions.set(from, { state: 'awaiting_language' });
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  } catch (outerErr) {
    console.error('[webhook] unexpected error', outerErr);
    res.status(500).end();
  }
}