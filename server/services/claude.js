import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildExtractPrompt() {
  const today = new Date().toISOString().slice(0, 10);
  return `Today's date is ${today}. Extract event details from the input and return ONLY a JSON object with these exact keys:
- title (string, the event name)
- date (string, YYYY-MM-DD format, or "" if not found)
- time (string, HH:MM 24h format, or "" if not found)
- location (string, venue or address, or "")
- description (string, 1-2 sentence summary of the event)

If the source mentions a date without a year, assume the current year (${today.slice(0, 4)}) unless that would place the event in the past, in which case use the next year.
Return ONLY the JSON object. No markdown, no explanation, no code fences.`;
}

export async function extractFromText(text) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `${buildExtractPrompt()}\n\nText to extract from:\n${text}`,
    }],
  });

  return JSON.parse(msg.content[0].text.trim());
}

export async function extractFromImage(base64Data, mediaType) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64Data },
        },
        {
          type: 'text',
          text: `This is an event flyer, invitation, or screenshot. ${buildExtractPrompt()}`,
        },
      ],
    }],
  });

  return JSON.parse(msg.content[0].text.trim());
}

export async function extractFromWhatsApp(text, imageUrl = null) {
  if (imageUrl) {
    // Download Twilio media and convert to base64
    const resp = await fetch(imageUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64')}`,
      },
    });
    const arrayBuffer = await resp.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    return extractFromImage(base64, contentType);
  }
  return extractFromText(text);
}
