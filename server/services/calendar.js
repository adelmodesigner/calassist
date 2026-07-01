import { google } from 'googleapis';
import db from '../db.js';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
}

export function storeTokens(tokens) {
  db.prepare(`
    INSERT INTO auth_tokens (id, google_access_token, google_refresh_token, google_token_expiry, updated_at)
    VALUES (1, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      google_access_token = excluded.google_access_token,
      google_refresh_token = COALESCE(excluded.google_refresh_token, google_refresh_token),
      google_token_expiry = excluded.google_token_expiry,
      updated_at = excluded.updated_at
  `).run(
    tokens.access_token,
    tokens.refresh_token || null,
    new Date(tokens.expiry_date || Date.now() + 3600000).toISOString(),
    new Date().toISOString(),
  );
}

export function isAuthenticated() {
  const row = db.prepare('SELECT google_refresh_token FROM auth_tokens WHERE id = 1').get();
  return !!row?.google_refresh_token;
}

export function clearTokens() {
  db.prepare('DELETE FROM auth_tokens WHERE id = 1').run();
}

export function storeUserEmail(email) {
  db.prepare('UPDATE auth_tokens SET user_email = ? WHERE id = 1').run(email);
}

export function getUserEmail() {
  const row = db.prepare('SELECT user_email FROM auth_tokens WHERE id = 1').get();
  return row?.user_email || null;
}

export function getAuthedClientExported() {
  return getAuthedClient();
}

async function getAuthedClient() {
  const tokens = db.prepare('SELECT * FROM auth_tokens WHERE id = 1').get();
  if (!tokens?.google_refresh_token) throw new Error('not_authenticated');

  oauth2Client.setCredentials({
    access_token: tokens.google_access_token,
    refresh_token: tokens.google_refresh_token,
    expiry_date: new Date(tokens.google_token_expiry).getTime(),
  });

  const expiry = new Date(tokens.google_token_expiry).getTime();
  if (expiry <= Date.now() + 60_000) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    storeTokens(credentials);
    oauth2Client.setCredentials(credentials);
  }

  return oauth2Client;
}

export async function listUpcomingEvents() {
  const auth = await getAuthedClient();
  const cal = google.calendar({ version: 'v3', auth });

  const res = await cal.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 30,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (res.data.items || []).map(item => ({
    id: `gcal-${item.id}`,
    googleEventId: item.id,
    status: 'approved',
    source: 'google_calendar',
    title: item.summary || '(No title)',
    date: item.start?.date || item.start?.dateTime?.slice(0, 10) || '',
    time: item.start?.dateTime?.slice(11, 16) || '',
    location: item.location || '',
    description: item.description || '',
    createdAt: item.created || new Date().toISOString(),
  }));
}

export async function createCalendarEvent(event) {
  if (!event.date) throw new Error('event has no date — fill in a date before approving');

  const auth = await getAuthedClient();
  const cal = google.calendar({ version: 'v3', auth });

  const tz = 'Europe/Lisbon';
  const hasTime = !!event.time?.trim();
  const startStr = hasTime ? `${event.date}T${event.time}:00` : event.date;
  // Google Calendar all-day events need end = day after start (exclusive end)
  const endStr = hasTime
    ? `${event.date}T${bumpHour(event.time)}:00`
    : bumpDate(event.date);

  console.log('[Calendar] creating event:', {
    title: event.title, date: event.date, time: event.time || '(all-day)', tz,
  });

  const { data } = await cal.events.insert({
    calendarId: 'primary',
    resource: {
      summary: event.title || '(No title)',
      location: event.location || undefined,
      description: event.description || undefined,
      start: hasTime ? { dateTime: startStr, timeZone: tz } : { date: startStr },
      end: hasTime ? { dateTime: endStr, timeZone: tz } : { date: endStr },
    },
  });

  console.log('[Calendar] created:', { id: data.id, link: data.htmlLink });
  return { id: data.id, htmlLink: data.htmlLink };
}

function bumpHour(time) {
  const [h, m] = time.split(':').map(Number);
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function bumpDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
