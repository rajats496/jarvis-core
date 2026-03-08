/**
 * Email service — Resend HTTP API (no SMTP needed, works on all cloud hosts).
 *
 * Required env vars:
 *   RESEND_API_KEY      — API key from https://resend.com/api-keys
 *   EMAIL_FROM          — Verified sender   (default: "onboarding@resend.dev" for testing)
 *   EMAIL_FROM_NAME     — Display name      (default: "J.A.R.V.I.S")
 *
 * Free tier: 100 emails/day, 3 000/month.
 * For production, add & verify your own domain on Resend then set EMAIL_FROM.
 */

const { Resend } = require('resend');
const logger     = require('../utils/logger');

const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();

logger.info(`[email] RESEND_API_KEY present: ${!!RESEND_API_KEY}`);

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
 * Send a JARVIS-themed OTP email via Resend HTTP API.
 * @param {string} to         Recipient email
 * @param {string} otp        6-digit OTP
 * @param {'signup'|'reset'} purpose
 * @returns {{ sent: boolean, reason?: string }}
 */
async function sendOtpEmail(to, otp, purpose) {
  if (!RESEND_API_KEY) {
    logger.info(`[email] DEV MODE — OTP for ${to} (${purpose}): ${otp}`);
    return { sent: false, reason: 'RESEND_API_KEY not configured on server' };
  }

  const fromName  = process.env.EMAIL_FROM_NAME || 'J.A.R.V.I.S';
  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const from      = `${fromName} <${fromEmail}>`;

  const subjectMap = {
    signup: 'Your J.A.R.V.I.S Verification Code',
    reset:  'J.A.R.V.I.S Password Reset Code',
  };

  const resend = new Resend(RESEND_API_KEY);

  logger.info(`[email] Sending OTP to ${to} via Resend (from: ${fromEmail})…`);

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: subjectMap[purpose],
    html: buildOtpHtml(otp, purpose, fromName),
    text: `Your J.A.R.V.I.S verification code is: ${otp}\n\nExpires in 10 minutes.`,
  });

  if (error) {
    logger.error(`[email] Resend API error: ${JSON.stringify(error)}`);
    throw new Error(`Resend: ${error.message || JSON.stringify(error)}`);
  }

  logger.info(`[email] OTP sent to ${to} — Resend ID: ${data?.id}`);
  return { sent: true };
}

module.exports = { sendOtpEmail };
