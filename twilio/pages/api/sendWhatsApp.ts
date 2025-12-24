// pages/api/sendWhatsApp.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';

if (!accountSid || !authToken) {
  throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in env');
}

const client = twilio(accountSid, authToken);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { toNumber, contentSid, variables } = req.body;

    if (!toNumber || !contentSid) {
      return res.status(400).json({ success: false, message: 'toNumber and contentSid are required' });
    }

    try {
      const message = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
        to: `whatsapp:${toNumber}`,
        contentSid,
        contentVariables: variables ? JSON.stringify(variables) : undefined,
      });

      // Return the entire Twilio message object so caller gets the response
      return res.status(201).json({ success: true, message });
    } catch (err) {
      const msg = (err as Error).message || String(err);
      return res.status(500).json({ success: false, error: msg });
    }
  } else {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
