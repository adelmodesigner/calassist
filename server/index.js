import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import eventsRouter from './routes/events.js';
import captureRouter from './routes/capture.js';
import webhooksRouter from './routes/webhooks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

const app = express();

app.use(cors({ origin: isProd ? false : 'http://localhost:5173' }));
app.use(express.json());
// Twilio sends form-encoded bodies for webhooks
app.use('/api/webhooks', express.urlencoded({ extended: false }));

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/capture', captureRouter);
app.use('/api/webhooks', webhooksRouter);

// Health check (Railway uses this)
app.get('/api/health', (_, res) => res.json({ ok: true }));

// Serve React build in production
if (isProd) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
});
