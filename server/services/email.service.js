/**
 * Email service — Brevo (formerly Sendinblue) Transactional Email REST API.
 *
 * Pure HTTPS (port 443) — works on Render, never blocked.
 * Free tier: 300 emails/day, no credit card needed.
 *
 * ── One-time setup (~3 min) ──────────────────────────────────────────────────
 *
 * STEP 1 — Create a free Brevo account:
 *   1. Go to https://app.brevo.com → sign up (free)
 *   2. Verify your email address
 *
 * STEP 2 — Get your API key:
 *   1. Top-right avatar → SMTP & API → API Keys tab
 *   2. Click "Generate a new API key" → name it "jarvis" → Copy it
 *
 * STEP 3 — Verify your sender email:
 *   1. Left menu → Senders & IP → Senders
 *   2. Click "Add a sender" → enter your name + www.rajatsri@gmail.com → Save
 *   3. Check your Gmail inbox → click the verification link Brevo sent
 *
 * STEP 4 — Add to Render environment:
 *   BREVO_API_KEY      = (from Step 2)
 *   BREVO_SENDER_EMAIL = www.rajatsri@gmail.com
 *   BREVO_SENDER_NAME  = J.A.R.V.I.S
 *   FRONTEND_URL       = https://jarvis-ai-assistance.vercel.app
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const logger = require('../utils/logger');

const BREVO_API_KEY      = (process.env.BREVO_API_KEY      || '').trim();
const BREVO_SENDER_EMAIL = (process.env.BREVO_SENDER_EMAIL || '').trim();
const BREVO_SENDER_NAME  = (process.env.BREVO_SENDER_NAME  || 'J.A.R.V.I.S').trim();

const emailConfigured = !!(BREVO_API_KEY && BREVO_SENDER_EMAIL);

logger.info(
  `[email] Brevo ready: ${emailConfigured} ` +
  `(apiKey=${!!BREVO_API_KEY} sender=${!!BREVO_SENDER_EMAIL})`
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
 * Send a JARVIS-themed verification link email via Brevo REST API.
 * @param {string} to         Recipient email
 * @param {string} link       Full URL the user should click
 * @param {'signup'|'reset'} purpose
 * @returns {{ sent: boolean, reason?: string, devLink?: string }}
 */
async function sendLinkEmail(to, link, purpose) {
  if (!emailConfigured) {
    logger.info(`[email] DEV MODE — Link for ${to} (${purpose}): ${link}`);
    return {
      sent: false,
      reason: 'Brevo not configured (need BREVO_API_KEY and BREVO_SENDER_EMAIL)',
      devLink: link,
    };
  }

  const subjectMap = {
    signup: 'Verify your J.A.R.V.I.S email address',
    reset:  'J.A.R.V.I.S Password Reset Link',
  };

  const textMap = {
    signup: `Verify your J.A.R.V.I.S account by visiting this link:\n${link}\n\nExpires in 24 hours.`,
    reset:  `Reset your J.A.R.V.I.S password by visiting this link:\n${link}\n\nExpires in 1 hour.`,
  };

  const body = JSON.stringify({
    sender:      { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
    to:          [{ email: to }],
    subject:     subjectMap[purpose],
    htmlContent: buildLinkHtml(link, purpose, BREVO_SENDER_NAME),
    textContent: textMap[purpose],
  });

  logger.info(`[email] Sending ${purpose} link to ${to} via Brevo…`);

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: {
      'accept':       'application/json',
      'api-key':      BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  logger.info(`[email] Link email sent to ${to} — Brevo messageId: ${data.messageId}`);
  return { sent: true };
}

module.exports = { sendLinkEmail };




