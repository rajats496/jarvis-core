@echo off
title Jarvis Desktop Agent
color 0A

echo.
echo  ╔════════════════════════════════════════════════╗
echo  ║         JARVIS DESKTOP AGENT                   ║
echo  ╚════════════════════════════════════════════════╝
echo.

REM ── Check Node.js ────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed!
    echo  Download from: https://nodejs.org
    pause
    exit /b 1
)

REM ── Install dependencies if needed ───────────────────────
if not exist "node_modules" (
    echo  [SETUP] First run: installing dependencies...
    npm install
    echo  [DONE] Dependencies installed!
    echo.
)

REM ══════════════════════════════════════════════════════════
REM  TUNNEL CONFIGURATION
REM  To auto-start an Ngrok tunnel, fill in your token below:
REM
REM  1. Get a free token at: https://dashboard.ngrok.com/authtokens
REM  2. Install ngrok package: npm install @ngrok/ngrok
REM  3. Uncomment and paste your token:
REM set NGROK_AUTHTOKEN=your_ngrok_token_here
REM
REM  If no token is set, you can run ngrok manually in another window:
REM    ngrok http 4000
REM  Then paste the printed URL into Jarvis Settings → Personal VM URL.
REM ══════════════════════════════════════════════════════════

REM ── Optional: Change port if 4000 is already in use ──────
REM set AGENT_PORT=4001

echo  [INFO] Starting Jarvis Desktop Agent...
echo  [INFO] Press Ctrl+C to stop.
echo.
node agent.js

pause
