import { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';

const MessagingResponse = twilio.twiml.MessagingResponse;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const twiml = new MessagingResponse();

    const incomingMsg = req.body.Body;  // Text message from user
    // You can also handle media using req.body.MediaUrl0 etc.

    // Process the message and set response
    let responseMessage = 'Thank you for your message.';

    // Example: echo back preferred language or image info
    if (incomingMsg.toLowerCase().includes('language')) {
      responseMessage = 'You mentioned the preferred language.';
    }

    twiml.message(responseMessage);

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
