import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { listUpcomingEvents, createCalendarEvent } from '../services/calendar.js';

const router = Router();
router.use(requireAuth);

// List: pending drafts from SQLite + upcoming approved from Google Calendar
router.get('/', async (req, res) => {
  try {
    const pending = db.prepare(
      "SELECT * FROM events WHERE status = 'pending' ORDER BY created_at DESC"
    ).all();

    let approved = [];
    try {
      approved = await listUpcomingEvents();
    } catch (err) {
      if (err.message !== 'not_authenticated') throw err;
      // Not yet auth'd with Google — return empty approved list
    }

    // Also include any locally-approved events that aren't yet in Google Cal
    const localApproved = db.prepare(
      "SELECT * FROM events WHERE status = 'approved' ORDER BY date ASC"
    ).all();

    const combined = [
      ...pending,
      ...approved,
      ...localApproved.filter(e => !e.google_event_id),
    ];

    res.json(combined);
  } catch (err) {
    console.error('GET /events error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Approve a pending draft → push to Google Calendar
router.post('/:id/approve', async (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!event) return res.status(404).json({ error: 'not_found' });

  try {
    const { id: googleEventId, htmlLink } = await createCalendarEvent(event);
    db.prepare(
      "UPDATE events SET status = 'approved', google_event_id = ? WHERE id = ?"
    ).run(googleEventId, event.id);
    res.json({ ok: true, googleEventId, htmlLink });
  } catch (err) {
    console.error('[Approve] calendar sync failed:', err.message);
    // Still mark approved locally even if calendar push fails
    db.prepare("UPDATE events SET status = 'approved' WHERE id = ?").run(event.id);
    res.json({ ok: true, warning: 'Calendar sync failed: ' + err.message });
  }
});

// Reject
router.delete('/:id', (req, res) => {
  db.prepare("DELETE FROM events WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Edit a pending draft
router.patch('/:id', (req, res) => {
  const { title, date, time, location, description } = req.body;
  db.prepare(
    "UPDATE events SET title=?, date=?, time=?, location=?, description=? WHERE id=?"
  ).run(title, date, time, location, description, req.params.id);
  res.json({ ok: true });
});

// Create a draft manually (used by capture routes)
router.post('/', (req, res) => {
  const id = randomUUID();
  const now = new Date().toISOString();
  const { title='', date='', time='', location='', description='', source, voice_duration='' } = req.body;
  db.prepare(
    `INSERT INTO events (id, status, title, date, time, location, description, source, voice_duration, created_at)
     VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, title, date, time, location, description, source, voice_duration, now);
  res.json({ id });
});

export default router;
