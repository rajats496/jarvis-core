/**
 * Email service — Gmail SMTP via Nodemailer.
 *
 * Required env vars:
 *   EMAIL_USER          — Your Gmail address  (e.g. jarvis@gmail.com)
 *   EMAIL_APP_PASSWORD  — Gmail App Password  (16-char, NOT your regular password)
 *   EMAIL_FROM_NAME     — Display name         (default: "J.A.R.V.I.S")
 */

const nodemailer = require('nodemailer');
const logger     = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    logger.warn('[email] EMAIL_USER / EMAIL_APP_PASSWORD not set — email sending disabled');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  return transporter;
}

/**
 * Send a JARVIS-themed OTP email.
 * @param {string} to         Recipient email
 * @param {string} otp        6-digit OTP
 * @param {'signup'|'reset'} purpose
 */
async function sendOtpEmail(to, otp, purpose) {
  const t = getTransporter();

  // Dev fallback: log OTP to console when email is not configured
  if (!t) {
    logger.info(`[email] DEV MODE — OTP for ${to} (${purpose}): ${otp}`);
    return;
  }

  const fromName  = process.env.EMAIL_FROM_NAME || 'J.A.R.V.I.S';
  const fromEmail = process.env.EMAIL_USER;

  const subjectMap = {
    signup: 'Your J.A.R.V.I.S Verification Code',
    reset:  'J.A.R.V.I.S Password Reset Code',
  };

  const headlineMap = {
    signup: 'Complete Your Registration',
    reset:  'Reset Your Password',
  };

  const descMap = {
    signup: 'Use the code below to verify your email and activate your J.A.R.V.I.S account.',
    reset:  'Use the code below to reset your J.A.R.V.I.S password. If you didn\'t request this, ignore this email.',
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { margin:0; padding:0; background:#0A0C10; font-family:'Segoe UI',Arial,sans-serif; }
    .wrap { max-width:480px; margin:40px auto; background:#0E111A; border:1px solid rgba(180,196,220,0.12); border-radius:16px; overflow:hidden; }
    .frost { height:2px; background:linear-gradient(90deg,transparent,rgba(200,220,255,0.40),transparent); }
    .body  { padding:36px 40px 32px; }
    .logo  { font-family:monospace; font-size:18px; font-weight:700; letter-spacing:0.14em; color:#B8C4D8; margin-bottom:6px; }
    .sub   { font-size:11px; color:#3A4558; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:28px; }
    h2     { font-size:17px; font-weight:600; color:#EEF2FF; margin:0 0 10px; letter-spacing:0.02em; }
    p      { font-size:14px; color:#6E7A90; line-height:1.6; margin:0 0 28px; }
    .otp-box { background:#0A0C10; border:1px solid rgba(184,196,216,0.18); border-radius:12px;
               padding:22px; text-align:center; margin-bottom:28px; }
    .otp   { font-family:monospace; font-size:36px; font-weight:700; letter-spacing:0.22em;
             color:#EEF2FF; }
    .expire { font-size:12px; color:#3A4558; text-align:center; margin-bottom:28px; letter-spacing:0.04em; }
    .footer { font-size:11px; color:#2E3545; text-align:center; padding:0 40px 28px; line-height:1.7; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="frost"></div>
    <div class="body">
      <div class="logo">J.A.R.V.I.S</div>
      <div class="sub">Secure Access Portal</div>
      <h2>${headlineMap[purpose]}</h2>
      <p>${descMap[purpose]}</p>
      <div class="otp-box">
        <div class="otp">${otp}</div>
      </div>
      <p class="expire">⏱ This code expires in <strong style="color:#6E7A90">10 minutes</strong>.<br/>Do not share this code with anyone.</p>
    </div>
    <div class="footer">
      This email was sent by ${fromName} · If you didn't request this, you can safely ignore it.
    </div>
  </div>
</body>
</html>`;

  await t.sendMail({
    from:    `"${fromName}" <${fromEmail}>`,
    to,
    subject: subjectMap[purpose],
    html,
    text: `Your J.A.R.V.I.S verification code is: ${otp}\n\nExpires in 10 minutes.`,
  });

  logger.info(`[email] OTP sent to ${to} (purpose: ${purpose})`);
}

module.exports = { sendOtpEmail };
