#!/bin/bash
# Jarvis Desktop Agent — macOS Startup Script

echo ""
echo "  ╔════════════════════════════════════════════════╗"
echo "  ║     JARVIS DESKTOP AGENT (macOS)               ║"
echo "  ╚════════════════════════════════════════════════╝"
echo ""

# ── Check Node.js ────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo "  [ERROR] Node.js is not installed!"
  echo "  Download from: https://nodejs.org"
  exit 1
fi

# ── Install dependencies if needed ───────────────────────
if [ ! -d "node_modules" ]; then
  echo "  [SETUP] First run: installing dependencies..."
  npm install
  echo "  [DONE] Dependencies installed!"
  echo ""
fi

# ══════════════════════════════════════════════════════════
#  TUNNEL CONFIGURATION — Edit these settings
#
#  To auto-start an Ngrok tunnel, fill in your token:
#  1. Get a free token at: https://dashboard.ngrok.com/authtokens
#  2. Install ngrok package: npm install @ngrok/ngrok
#  3. Uncomment and paste your token below:
# export NGROK_AUTHTOKEN="your_ngrok_token_here"
#
#  If no token is set, run ngrok manually in another terminal:
#    ngrok http 4000
#  Then paste the printed URL into Jarvis Settings → Personal VM URL.
# ══════════════════════════════════════════════════════════

# Optional: Agent security key
# export AGENT_SECRET="your_secret_here"

# Optional: Change port if 4000 is already in use
# export AGENT_PORT=4001

echo "  [INFO] Starting Jarvis Desktop Agent (macOS)..."
echo "  [INFO] Press Ctrl+C to stop."
echo ""
node agent-mac.js
