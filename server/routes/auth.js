import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getAuthUrl, storeTokens, isAuthenticated, clearTokens, storeUserEmail } from '../services/calendar.js';
import { google } from 'googleapis';

const router = Router();

router.get('/status', (req, res) => {
  res.json({ authenticated: isAuthenticated() });
});

router.get('/google', (req, res) => {
  res.redirect(getAuthUrl());
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code');

  try {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
    const { tokens } = await oauth2.getToken(code);
    storeTokens(tokens);

    // Fetch and store the user's email for later use (email notifications)
    try {
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const { email } = await infoRes.json();
      if (email) storeUserEmail(email);
      console.log('Stored user email:', email);
    } catch (e) {
      console.warn('Could not fetch user email:', e.message);
    }

    const token = jwt.sign({ authenticated: true }, process.env.JWT_SECRET, {
      expiresIn: '90d',
    });

    // Redirect back to the frontend with the token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?token=${token}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Authentication failed. Check server logs.');
  }
});

router.post('/logout', (req, res) => {
  clearTokens();
  res.json({ ok: true });
});

export default router;
