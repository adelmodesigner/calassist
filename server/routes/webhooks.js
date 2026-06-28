import { Router } from 'express';
import { randomUUID } from 'crypto';
import twilio from 'twilio';
import db from '../db.js';
import { extractFromWhatsApp } from '../services/claude.js';

const router = Router();

// Twilio sends form-encoded POST, not JSON
router.post('/whatsapp', async (req, res) => {
  // Validate the request is genuinely from Twilio
  const signature = req.headers['x-twilio-signature'];
  const url = `${process.env.PUBLIC_URL}/api/webhooks/whatsapp`;
  const valid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    signature,
    url,
    req.body,
  );

  if (!valid && process.env.NODE_ENV === 'production') {
    return res.status(403).send('Forbidden');
  }

  const body = req.body.Body || '';
  const mediaUrl = req.body.MediaUrl0 || null;
  const numMedia = parseInt(req.body.NumMedia || '0', 10);

  try {
    let fields = {};
    if (body.trim() || numMedia > 0) {
      fields = await extractFromWhatsApp(body, mediaUrl);
    }

    const id = randomUUID();
    db.prepare(
      `INSERT INTO events (id, status, title, date, time, location, description, source, created_at)
       VALUES (?, 'pending', ?, ?, ?, ?, ?, 'whatsapp', ?)`
    ).run(
      id,
      fields.title || body.slice(0, 80) || '(WhatsApp message)',
      fields.date || '',
      fields.time || '',
      fields.location || '',
      fields.description || body || '',
      new Date().toISOString(),
    );
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
  }

  // Respond with empty TwiML — required by Twilio
  res.set('Content-Type', 'text/xml');
  res.send('<Response/>');
});

export default router;
