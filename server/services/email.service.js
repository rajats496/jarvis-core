/**
 * Email service — Gmail REST API via googleapis.
 *
 * Pure HTTPS (port 443) — works on Render, never blocked.
 * Uses your own Gmail account. Free, works immediately after OAuth2 setup.
 *
 * ── One-time setup (~10 min) ─────────────────────────────────────────────────
 *
 * STEP 1 — Create OAuth2 credentials in Google Cloud Console:
 *   1. Go to https://console.cloud.google.com → New Project → Create
 *   2. APIs & Services → Library → search "Gmail API" → Enable
 *   3. APIs & Services → Credentials → + Create Credentials → OAuth client ID
 *   4. Application type: Web application
 *   5. Authorized redirect URI: https://developers.google.com/oauthplayground
 *   6. Create → copy the Client ID and Client Secret
 *
 * STEP 2 — Get a Refresh Token:
 *   1. Go to https://developers.google.com/oauthplayground
 *   2. Gear icon (top right) → check "Use your own OAuth credentials"
 *   3. Paste your Client ID + Client Secret → Close
 *   4. On the left, scroll to "Gmail API v1" → select:  https://mail.google.com/
 *   5. Click "Authorize APIs" → sign in with www.rajatsri@gmail.com → Allow
 *   6. Click "Exchange authorization code for tokens"
 *   7. Copy the "Refresh token"
 *
 * STEP 3 — Add these 4 vars to Render environment:
 *   GMAIL_USER           = www.rajatsri@gmail.com
 *   GMAIL_CLIENT_ID      = (from Step 1)
 *   GMAIL_CLIENT_SECRET  = (from Step 1)
 *   GMAIL_REFRESH_TOKEN  = (from Step 2)
 *   FRONTEND_URL         = https://jarvis-ai-assistance.vercel.app
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { google } = require('googleapis');
const logger     = require('../utils/logger');

const GMAIL_USER          = (process.env.GMAIL_USER          || '').trim();
const GMAIL_CLIENT_ID     = (process.env.GMAIL_CLIENT_ID     || '').trim();
const GMAIL_CLIENT_SECRET = (process.env.GMAIL_CLIENT_SECRET || '').trim();
const GMAIL_REFRESH_TOKEN = (process.env.GMAIL_REFRESH_TOKEN || '').trim();

const emailConfigured = !!(GMAIL_USER && GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN);

logger.info(
  `[email] Gmail API ready: ${emailConfigured} ` +
  `(user=${!!GMAIL_USER} clientId=${!!GMAIL_CLIENT_ID} secret=${!!GMAIL_CLIENT_SECRET} refresh=${!!GMAIL_REFRESH_TOKEN})`
);

/**
 * Build the JARVIS-themed verification link HTML email.
 */
function buildLinkHtml(link, purpose, fromName) {
  const headlineMap = {
    signup: 'Verify Your Email Address',
    reset:  'Reset Your Password',
  };
  const descMap = {
    signup: 'Click the button below to verify your email and activate your J.A.R.V.I.S account.',
    reset:  'Click the button below to reset your J.A.R.V.I.S password. If you didn\'t request this, ignore this email.',
  };
  const btnLabelMap = {
    signup: 'VERIFY EMAIL',
    reset:  'RESET PASSWORD',
  };
  const expiryMap = {
    signup: '24 hours',
    reset:  '1 hour',
  };

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#0A0C10;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#0E111A;border:1px solid rgba(180,196,220,0.12);border-radius:16px;overflow:hidden;">
    <div style="height:2px;background:linear-gradient(90deg,transparent,rgba(200,220,255,0.40),transparent);"></div>
    <div style="padding:36px 40px 32px;">
      <div style="font-family:monospace;font-size:18px;font-weight:700;letter-spacing:0.14em;color:#B8C4D8;margin-bottom:6px;">J.A.R.V.I.S</div>
      <div style="font-size:11px;color:#3A4558;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:28px;">Secure Access Portal</div>
      <h2 style="font-size:17px;font-weight:600;color:#EEF2FF;margin:0 0 10px;letter-spacing:0.02em;">${headlineMap[purpose]}</h2>
      <p style="font-size:14px;color:#6E7A90;line-height:1.6;margin:0 0 28px;">${descMap[purpose]}</p>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${link}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1E2430,#2C3448);border:1px solid rgba(180,200,230,0.25);border-radius:10px;color:#C8D8F0;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.12em;text-decoration:none;" target="_blank">
          ${btnLabelMap[purpose]}
        </a>
      </div>
      <p style="font-size:12px;color:#3A4558;text-align:center;margin-bottom:16px;letter-spacing:0.04em;">
        This link expires in <strong style="color:#6E7A90;">${expiryMap[purpose]}</strong>.<br/>Do not share this link with anyone.
      </p>
      <p style="font-size:11px;color:#2E3545;text-align:center;margin-bottom:0;word-break:break-all;">
        If the button doesn't work, copy this URL:<br/>
        <a href="${link}" style="color:#4A5568;font-size:11px;">${link}</a>
      </p>
    </div>
    <div style="font-size:11px;color:#2E3545;text-align:center;padding:0 40px 28px;line-height:1.7;">
      This email was sent by ${fromName} &middot; If you didn&rsquo;t request this, you can safely ignore it.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Build a base64url-encoded RFC-2822 MIME email (required by Gmail API).
 */
function encodeRawEmail(to, subject, html, text, fromAddress, fromName) {
  const boundary = `_jarvis_${Date.now()}`;
  const lines = [
    `From: "${fromName}" <${fromAddress}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    text,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    ``,
    html,
    ``,
    `--${boundary}--`,
  ];
  return Buffer.from(lines.join('\r\n')).toString('base64url');
}

/**
 * Send a JARVIS-themed verification link email via Gmail REST API.
 * @param {string} to         Recipient email
 * @param {string} link       Full URL the user should click
 * @param {'signup'|'reset'} purpose
 * @returns {{ sent: boolean, reason?: string }}
 */
async function sendLinkEmail(to, link, purpose) {
  if (!emailConfigured) {
    logger.info(`[email] DEV MODE — Link for ${to} (${purpose}): ${link}`);
    return {
      sent: false,
      reason: 'Gmail API not configured (need GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)',
      devLink: link,
    };
  }

  const fromName = process.env.EMAIL_FROM_NAME || 'J.A.R.V.I.S';

  const subjectMap = {
    signup: 'Verify your J.A.R.V.I.S email address',
    reset:  'J.A.R.V.I.S Password Reset Link',
  };

  const textMap = {
    signup: `Verify your J.A.R.V.I.S account by visiting this link:\n${link}\n\nExpires in 24 hours.`,
    reset:  `Reset your J.A.R.V.I.S password by visiting this link:\n${link}\n\nExpires in 1 hour.`,
  };

  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const raw = encodeRawEmail(
    to,
    subjectMap[purpose],
    buildLinkHtml(link, purpose, fromName),
    textMap[purpose],
    GMAIL_USER,
    fromName
  );

  logger.info(`[email] Sending ${purpose} link to ${to} via Gmail API…`);

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  logger.info(`[email] Link email sent to ${to} — Gmail messageId: ${result.data.id}`);
  return { sent: true };
}

module.exports = { sendLinkEmail };




