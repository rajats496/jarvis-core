/**
 * Jarvis Desktop Agent — macOS
 * ---
 * A tiny local server that runs on the user's Mac.
 * It receives commands from the Jarvis website (via an Ngrok tunnel),
 * checks they are safe (whitelist), and executes them via bash/zsh.
 *
 * Usage:
 *   1. npm install
 *   2. chmod +x start.sh && ./start.sh   (or: node agent-mac.js)
 *   3. Set NGROK_AUTHTOKEN in start.sh for auto-tunnel
 */

const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = Number(process.env.AGENT_PORT) || 4000;
const AGENT_SECRET = process.env.AGENT_SECRET || '';

app.use(cors());
app.use(express.json());

// ─── Whitelisted Commands ────────────────────────────────────────────────────
const COMMANDS = {
    // System info
    'battery': "pmset -g batt | grep -E '([0-9]+%).*' | sed 's/.*\\t//'",
    'cpu': "sysctl -n machdep.cpu.brand_string && echo 'Load:' $(top -l 1 -s 0 | grep 'CPU usage' | awk '{print $3}')",
    'ram': "vm_stat | awk '/Pages free/ {free=$3} /Pages active/ {active=$3} /Pages wired/ {wired=$4} END {total=(free+active+wired)*4096/1073741824; used=(active+wired)*4096/1073741824; printf \"Total: %.1fGB | Used: %.1fGB | Free: %.1fGB\", total, used, total-used}'",
    'disk': 'df -h | grep -E "^/dev/" | awk \'{print $1": "$3" used / "$4" free"}\'',
    'df': 'df -h | grep -E "^/dev/" | awk \'{print $1": "$3" used / "$4" free"}\'',
    'df -h': 'df -h | grep -E "^/dev/" | awk \'{print $1": "$3" used / "$4" free"}\'',
    'network': "ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo 'No network connection'",
    'hostname': 'hostname',
    'os': 'sw_vers',
    'uptime': 'uptime',
    'processes': "ps aux --sort=-%cpu | head -11 | awk 'NR>1 {print $11\" (CPU: \"$3\"%)\"}'",
    'status': 'echo "Agent running on $(hostname) | Uptime: $(uptime | sed \"s/.*up //;s/,.*/\")"',
    'free': "vm_stat | awk '/Pages free/ {free=$3} /Pages active/ {active=$3} END {printf \"Free: %.0fMB | Active: %.0fMB\", free*4096/1048576, active*4096/1048576}'",
    'free -m': "vm_stat | awk '/Pages free/ {free=$3} /Pages active/ {active=$3} END {printf \"Free: %.0fMB | Active: %.0fMB\", free*4096/1048576, active*4096/1048576}'",
    'wifi name': "networksetup -getairportnetwork en0 2>/dev/null || echo 'Not connected to Wi-Fi'",
    'wifi list': '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s 2>/dev/null | head -10',
    'internet test': 'ping -c 3 8.8.8.8 | tail -2',
    'clipboard': 'pbpaste',
    'clear clipboard': 'echo "" | pbcopy && echo "Clipboard cleared"',
    'ip info': 'curl -s https://ipinfo.io/json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get(\'ip\',\'\'), d.get(\'city\',\'\'), d.get(\'country\',\'\'))"',

    // Power & Screen
    'lock': 'osascript -e \'tell application "System Events" to keystroke "q" using {control down, command down}\'',
    'sleep': 'pmset sleepnow',
    'display off': 'pmset displaysleepnow',
    'battery saver on': "sudo pmset -a lowpowermode 1 && echo 'Low Power Mode enabled'",
    'battery saver off': "sudo pmset -a lowpowermode 0 && echo 'Low Power Mode disabled'",

    // Volume (AppleScript)
    'volume mute': "osascript -e 'set volume output muted true'",
    'volume unmute': "osascript -e 'set volume output muted false'",
    'volume up': "osascript -e 'set volume output volume (output volume of (get volume settings) + 10)'",
    'volume down': "osascript -e 'set volume output volume (output volume of (get volume settings) - 10)'",
    'get volume': "osascript -e 'output volume of (get volume settings)'",

    // App launchers (AppleScript)
    'open notepad': "open -a TextEdit",
    'open calculator': "open -a Calculator",
    'open explorer': "open ~",
    'open chrome': "open -a 'Google Chrome'",
    'open safari': "open -a Safari",
    'open spotify': "open -a Spotify",
    'open vscode': "open -a 'Visual Studio Code'",
    'open terminal': "open -a Terminal",
    'open finder': "open -a Finder",

    // Files
    'recent files': "find ~/Documents ~/Desktop -newer $(date -v -1d +%Y%m%d) -type f 2>/dev/null | head -10",
    'downloads': "ls -lt ~/Downloads | head -10 | awk '{print $NF}'",
};

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function checkSecret(req, res, next) {
    if (!AGENT_SECRET) return next();
    const provided = req.headers['x-agent-secret'] || req.body?.secret;
    if (provided !== AGENT_SECRET) {
        return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }
    next();
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ ok: true, hostname: os.hostname(), platform: os.platform(), uptime: Math.floor(os.uptime()) + 's' });
});

app.get('/commands', (req, res) => {
    res.json({ commands: Object.keys(COMMANDS) });
});

app.post('/execute', checkSecret, (req, res) => {
    const raw = String(req.body?.command || '').trim().toLowerCase();
    if (!raw) return res.status(400).json({ success: false, error: 'No command provided.' });

    // Screenshot handled separately — returns base64 image
    if (raw === 'screenshot') {
        return takeMacScreenshot(res);
    }

    const shellCmd = COMMANDS[raw];
    if (!shellCmd) {
        return res.status(403).json({
            success: false,
            error: `Command "${raw}" is not whitelisted.`,
            allowed: Object.keys(COMMANDS),
        });
    }

    console.log(`[CMD] → ${raw}`);
    exec(shellCmd, { timeout: 10000, shell: '/bin/zsh' }, (error, stdout, stderr) => {
        if (error && !stdout) {
            console.error(`[ERR] ${error.message}`);
            return res.json({ success: false, result: stderr?.trim() || error.message });
        }
        const output = stdout.trim() || 'Command completed (no output).';
        console.log(`[OUT] ${output.slice(0, 120)}`);
        res.json({ success: true, result: output });
    });
});

// ─── Mac Screenshot ───────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

function takeMacScreenshot(res) {
    const tmpFile = '/tmp/jarvis_screenshot.jpg';
    console.log('[CMD] → screenshot');
    exec(`screencapture -t jpg -x ${tmpFile}`, { timeout: 10000 }, (error) => {
        if (error) {
            return res.json({ success: false, result: error.message });
        }
        try {
            const data = fs.readFileSync(tmpFile);
            const base64 = data.toString('base64');
            fs.unlinkSync(tmpFile); // clean up
            console.log(`[Screenshot] captured (${Math.round(base64.length / 1024)}KB base64)`);
            res.json({ success: true, result: base64, type: 'image', mimeType: 'image/jpeg' });
        } catch (e) {
            res.json({ success: false, result: 'Failed to read screenshot file: ' + e.message });
        }
    });
}



// ─── Tunnel Launcher ─────────────────────────────────────────────────────────
async function startTunnel() {
    const ngrokToken = process.env.NGROK_AUTHTOKEN || '';

    if (ngrokToken) {
        try {
            const ngrok = require('@ngrok/ngrok');
            console.log('\n🔄 Starting ngrok tunnel...');
            const listener = await ngrok.forward({ addr: PORT, authtoken_from_env: true });
            const url = listener.url();
            console.log('\n🌐 ══════════════════════════════════════════════════════');
            console.log(`   YOUR TUNNEL URL: ${url}`);
            console.log('   ══════════════════════════════════════════════════════');
            console.log('\n👆 Paste this URL into: Jarvis Dashboard → Settings → Personal VM URL');
            console.log('   (URL changes on restart — update Settings if needed)\n');
        } catch {
            console.log('\n⚠️  Ngrok package not installed. Run: npm install @ngrok/ngrok');
            printManualInstructions();
        }
    } else {
        printManualInstructions();
    }
}

function printManualInstructions() {
    console.log('\nℹ️  No tunnel configured. To expose this agent to the internet:');
    console.log('   Option A — Ngrok (recommended):');
    console.log('     1. Get a free token at https://ngrok.com');
    console.log('     2. Edit start.sh and set: export NGROK_AUTHTOKEN=your_token');
    console.log('     3. Run: npm install @ngrok/ngrok');
    console.log('');
    console.log('   Option B — Manual Ngrok:');
    console.log(`     Run in a new terminal: ngrok http ${PORT}`);
    console.log('');
    console.log('   Then paste the printed URL into: Jarvis Dashboard → Settings → Personal VM URL\n');
}

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║    JARVIS DESKTOP AGENT (macOS)          ║');
    console.log(`║    Running on port ${PORT}                 ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log(`\n✅ Local:    http://localhost:${PORT}`);
    console.log(`📋 Commands: ${Object.keys(COMMANDS).length} whitelisted`);
    await startTunnel();
});
