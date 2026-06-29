import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import db from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { extractFromText, extractFromImage } from '../services/claude.js';

const router = Router();
router.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function saveEvent(fields, source) {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO events (id, status, title, date, time, location, description, source, created_at)
     VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, fields.title || '', fields.date || '', fields.time || '', fields.location || '', fields.description || '', source, new Date().toISOString());
  return id;
}

// Text capture
router.post('/text', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

  try {
    const fields = await extractFromText(text);
    const id = saveEvent(fields, 'text');
    res.json({ id, fields });
  } catch (err) {
    console.error('Text extract error:', err);
    res.status(500).json({ error: 'Extraction failed: ' + err.message });
  }
});

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Image capture
router.post('/image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'image file is required' });

  const mediaType = req.file.mimetype || 'image/jpeg';
  if (!SUPPORTED_IMAGE_TYPES.includes(mediaType)) {
    return res.status(400).json({
      error: `Unsupported format: ${mediaType}. Please use JPEG, PNG, GIF, or WebP. On iPhone, try taking a screenshot instead of uploading directly from the camera roll.`,
    });
  }

  try {
    const base64 = req.file.buffer.toString('base64');
    const fields = await extractFromImage(base64, mediaType);
    const id = saveEvent(fields, 'image');
    res.json({ id, fields });
  } catch (err) {
    console.error('Image extract error:', err);
    res.status(500).json({ error: 'Extraction failed: ' + err.message });
  }
});

// Audio (voice note — no transcription, just creates a draft with audio flag)
router.post('/audio', (req, res) => {
  const { duration } = req.body;
  const id = randomUUID();
  db.prepare(
    `INSERT INTO events (id, status, title, date, time, location, description, source, voice_duration, created_at)
     VALUES (?, 'pending', '', '', '', '', '', 'audio', ?, ?)`
  ).run(id, duration || '0:00', new Date().toISOString());
  res.json({ id });
});

export default router;
