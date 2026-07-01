import { google } from 'googleapis';

export async function sendEventConfirmation(authedClient, toEmail, event, calendarLink) {
  const gmail = google.gmail({ version: 'v1', auth: authedClient });

  const dateLabel = event.date
    ? new Date(`${event.date}T12:00:00Z`).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  const subject = `📅 New event: ${event.title || 'Event'}`;
  const html = `
<div style="font-family:sans-serif;max-width:480px;padding:24px">
  <h2 style="margin:0 0 16px;color:#1a1a1a">${event.title || 'New Event'}</h2>
  ${dateLabel ? `<p style="margin:0 0 8px"><strong>📅 Date:</strong> ${dateLabel}${event.time ? ` at ${event.time}` : ''}</p>` : ''}
  ${event.location ? `<p style="margin:0 0 8px"><strong>📍 Location:</strong> ${event.location}</p>` : ''}
  ${event.description ? `<p style="margin:0 0 8px"><strong>📝 Notes:</strong> ${event.description}</p>` : ''}
  <br>
  <a href="${calendarLink}" style="display:inline-block;background:#7c3aed;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Open in Google Calendar →</a>
  <p style="margin:24px 0 0;color:#888;font-size:12px">Added via CalAssist</p>
</div>`;

  const raw = Buffer.from(
    [`To: ${toEmail}`, `Subject: ${subject}`, 'Content-Type: text/html; charset=utf-8', 'MIME-Version: 1.0', '', html].join('\r\n')
  ).toString('base64url');

  await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  console.log('[Gmail] confirmation sent to', toEmail);
}
