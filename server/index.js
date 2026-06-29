// Prevent crash from any unhandled error — log it instead so we can diagnose
process.on('uncaughtException', (err) => {
  console.error('[CRASH] uncaughtException:', err?.message, '\n', err?.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[CRASH] unhandledRejection:', reason?.message ?? reason);
});

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const app = express();

// Health endpoint registered FIRST before any risky imports
app.get('/api/health', (_, res) => res.json({ ok: true }));

// Start listening immediately so healthcheck always passes
app.listen(PORT, () => {
  console.log(`Server on port ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'unset'})`);
});

// Load everything else with dynamic imports so a crash here doesn't kill the process
try {
  const { default: cors } = await import('cors');
  app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173' }));
  app.use(express.json());
  app.use('/api/webhooks', express.urlencoded({ extended: false }));

  const [authRouter, eventsRouter, captureRouter, webhooksRouter] = await Promise.all([
    import('./routes/auth.js').then(m => m.default),
    import('./routes/events.js').then(m => m.default),
    import('./routes/capture.js').then(m => m.default),
    import('./routes/webhooks.js').then(m => m.default),
  ]);

  app.use('/api/auth', authRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/capture', captureRouter);
  app.use('/api/webhooks', webhooksRouter);

  console.log('All routes loaded OK');
} catch (err) {
  console.error('Route setup failed:', err.message, '\n', err.stack);
}

// Serve frontend build
const distPath = path.join(__dirname, '../dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // Express 5 dropped support for the bare '*' wildcard — use app.use as catch-all instead
  app.use((_, res) => res.sendFile(path.join(distPath, 'index.html')));
  console.log('Serving frontend from', distPath);
} else {
  console.warn('No dist/ folder found — frontend not served');
}
