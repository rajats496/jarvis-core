/**
 * Email service — Brevo (Sendinblue) HTTP API.
 *
 * Uses native fetch (Node 18+), no SMTP, no extra npm packages.
 * Works on Render, Vercel, Railway, etc. (only needs HTTPS port 443).
 *
 * Setup (free — 300 emails/day):
 *   1. Sign up at https://www.brevo.com (free)
 *   2. Verify your sender email at https://app.brevo.com/senders
 *      (just click the confirmation link Brevo sends you — no domain needed)
 *   3. Get your API key at https://app.brevo.com/settings/keys/api
 *   4. Set BREVO_API_KEY and BREVO_SENDER_EMAIL on Render
 *
 * Required env vars:
 *   BREVO_API_KEY       — API key from Brevo dashboard
 *   BREVO_SENDER_EMAIL  — The verified sender email (the one you verified in step 2)
 *   EMAIL_FROM_NAME     — Display name (default: "J.A.R.V.I.S")
 */

const logger = require('../utils/logger');

const BREVO_API_KEY = (process.env.BREVO_API_KEY || '').trim();
const BREVO_SENDER  = (process.env.BREVO_SENDER_EMAIL || '').trim();

logger.info(`[email] BREVO_API_KEY present: ${!!BREVO_API_KEY}, BREVO_SENDER_EMAIL present: ${!!BREVO_SENDER}`);

/**
 * Build the JARVIS-themed OTP HTML email.
 */
function buildOtpHtml(otp, purpose, fromName) {
  const headlineMap = {
    signup: 'Complete Your Registration',
    reset:  'Reset Your Password',
  };
  const descMap = {
    signup: 'Use the code below to verify your email and activate your J.A.R.V.I.S account.',
    reset:  'Use the code below to reset your J.A.R.V.I.S password. If you didn\'t request this, ignore this email.',
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
      <div style="background:#0A0C10;border:1px solid rgba(184,196,216,0.18);border-radius:12px;padding:22px;text-align:center;margin-bottom:28px;">
        <div style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:0.22em;color:#EEF2FF;">${otp}</div>
      </div>
      <p style="font-size:12px;color:#3A4558;text-align:center;margin-bottom:28px;letter-spacing:0.04em;">
        This code expires in <strong style="color:#6E7A90;">10 minutes</strong>.<br/>Do not share this code with anyone.
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
 * Send a JARVIS-themed OTP email via Brevo HTTP API.
 * @param {string} to         Recipient email
 * @param {string} otp        6-digit OTP
 * @param {'signup'|'reset'} purpose
 * @returns {{ sent: boolean, reason?: string }}
 */
async function sendOtpEmail(to, otp, purpose) {
  if (!BREVO_API_KEY || !BREVO_SENDER) {
    logger.info(`[email] DEV MODE — OTP for ${to} (${purpose}): ${otp}`);
    return { sent: false, reason: 'BREVO_API_KEY or BREVO_SENDER_EMAIL not configured on server' };
  }

  const fromName = process.env.EMAIL_FROM_NAME || 'J.A.R.V.I.S';

  const subjectMap = {
    signup: 'Your J.A.R.V.I.S Verification Code',
    reset:  'J.A.R.V.I.S Password Reset Code',
  };

  const payload = {
    sender:      { name: fromName, email: BREVO_SENDER },
    to:          [{ email: to }],
    subject:     subjectMap[purpose],
    htmlContent: buildOtpHtml(otp, purpose, fromName),
    textContent: `Your J.A.R.V.I.S verification code is: ${otp}\n\nExpires in 10 minutes.`,
  };

  logger.info(`[email] Sending OTP to ${to} via Brevo (sender: ${BREVO_SENDER})…`);

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: {
      'accept':       'application/json',
      'content-type': 'application/json',
      'api-key':      BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000), // 15 s hard ceiling
  });

  const data = await res.json();

  if (!res.ok) {
    logger.error(`[email] Brevo API ${res.status}: ${JSON.stringify(data)}`);
    throw new Error(`Brevo: ${data.message || JSON.stringify(data)}`);
  }

  logger.info(`[email] OTP sent to ${to} — Brevo messageId: ${data.messageId}`);
  return { sent: true };
}

module.exports = { sendOtpEmail };
