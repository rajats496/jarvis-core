/**
 * Jarvis Desktop Agent
 * ---
 * A tiny local server that runs on the user's Windows laptop.
 * It receives commands from the Jarvis website via a secure tunnel
 * (Pinggy.io — free, no domain or installation required)
 * checks they are safe (whitelist), and executes them via PowerShell.
 *
 * Tunnel Priority:
 *   1. Pinggy.io (PINGGY_TOKEN set in start.bat) ← auto-start, just SSH
 *   2. Ngrok    (NGROK_AUTHTOKEN set)            ← fallback
 *   3. None     — run: ssh -p 443 -R0:localhost:4000 a.pinggy.io
 */

const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = Number(process.env.AGENT_PORT) || 4000;

app.use(cors());
app.use(express.json());

// ─── Whitelisted Commands ────────────────────────────────────────────────────
const COMMANDS = {
    // System info
    'uptime': 'net statistics workstation | findstr "since"',
    'battery': '$b = Get-WmiObject -Class Win32_Battery; if ($b) { "Battery: " + $b.EstimatedChargeRemaining + "% | Status: " + @{1="Discharging";2="AC Power";3="Fully Charged"}[$b.BatteryStatus] } else { "No battery found (desktop PC)" }',
    'cpu': '(Get-WmiObject -Class Win32_Processor).Name + " | Load: " + (Get-WmiObject -Class Win32_Processor).LoadPercentage + "%"',
    'ram': '$o=Get-WmiObject Win32_OperatingSystem; "Total: "+[math]::Round($o.TotalVisibleMemorySize/1MB,1)+"GB | Free: "+[math]::Round($o.FreePhysicalMemory/1MB,1)+"GB | Used: "+[math]::Round(($o.TotalVisibleMemorySize-$o.FreePhysicalMemory)/1MB,1)+"GB"',
    'disk': 'Get-PSDrive -PSProvider FileSystem | Where-Object {$_.Used -ne $null} | ForEach-Object { $_.Name + ": Used " + [math]::Round($_.Used/1GB,1) + "GB / Free " + [math]::Round($_.Free/1GB,1) + "GB" }',
    'df': 'Get-PSDrive -PSProvider FileSystem | Where-Object {$_.Used -ne $null} | ForEach-Object { $_.Name + ": Used " + [math]::Round($_.Used/1GB,1) + "GB / Free " + [math]::Round($_.Free/1GB,1) + "GB" }',
    'df -h': 'Get-PSDrive -PSProvider FileSystem | Where-Object {$_.Used -ne $null} | ForEach-Object { $_.Name + ": Used " + [math]::Round($_.Used/1GB,1) + "GB / Free " + [math]::Round($_.Free/1GB,1) + "GB" }',
    'network': 'ipconfig | findstr "IPv4"',
    'hostname': 'hostname',
    'os': '[System.Environment]::OSVersion.VersionString',
    'processes': 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 | ForEach-Object { $_.Name + " (CPU: " + [math]::Round($_.CPU,1) + ")" }',
    'status': '"Agent running on " + $env:COMPUTERNAME + " | Uptime: " + ((Get-Date) - (gcim Win32_OperatingSystem).LastBootUpTime).ToString("d\\.hh\\:mm")',

    // Power
    'battery saver on': 'powercfg /setactive SCHEME_MAX',
    'battery saver off': 'powercfg /setactive SCHEME_BALANCED',
    'sleep': 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0',
    'lock': 'rundll32.exe user32.dll,LockWorkStation',

    // Volume
    'volume mute': '(New-Object -ComObject WScript.Shell).SendKeys([char]173); "Volume Muted"',
    'volume unmute': '(New-Object -ComObject WScript.Shell).SendKeys([char]173); "Volume Unmuted"',
    'volume up': '1..5 | ForEach-Object { (New-Object -ComObject WScript.Shell).SendKeys([char]175) }; "Volume Increased"',
    'volume down': '1..5 | ForEach-Object { (New-Object -ComObject WScript.Shell).SendKeys([char]174) }; "Volume Decreased"',

    // App control
    'open notepad': 'Start-Process notepad.exe',
    'open calculator': 'Start-Process calc.exe',
    'open explorer': 'Start-Process explorer.exe',
    'open chrome': 'Start-Process "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" -ErrorAction SilentlyContinue; if(-not $?) { Start-Process "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" }',
    'open spotify': 'Start-Process "$env:APPDATA\\Spotify\\Spotify.exe"',
    'open vscode': 'Start-Process code',
    'open terminal': 'Start-Process wt.exe -ErrorAction SilentlyContinue; if(-not $?) { Start-Process powershell.exe }',
    'open settings': 'Start-Process ms-settings:',
    'open camera': 'Start-Process microsoft.windows.camera:',
    'open paint': 'Start-Process mspaint.exe',
    'open task manager': 'Start-Process taskmgr.exe',

    // Clipboard (use .NET API — works in non-interactive PS sessions)
    'clipboard': 'Add-Type -AssemblyName System.Windows.Forms; $t=[System.Windows.Forms.Clipboard]::GetText(); if($t){$t}else{"(Clipboard is empty)"} ',
    'clear clipboard': 'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::Clear(); "Clipboard cleared."',

    // Network extras
    'wifi name': '(netsh wlan show interfaces) | Select-String "\\bSSID\\b" | Select-Object -First 1 | ForEach-Object { $_.ToString().Trim() }',
    'wifi list': 'netsh wlan show networks mode=Bssid | findstr /C:"SSID" | Select-Object -First 10',
    'internet test': 'Test-Connection -ComputerName 8.8.8.8 -Count 3 | ForEach-Object { "Ping " + $_.Address + ": " + $_.ResponseTime + "ms" }',
    'ip info': 'try { $r=Invoke-RestMethod "https://ipinfo.io/json" -TimeoutSec 5; "IP: "+$r.ip+" | City: "+$r.city+" | Country: "+$r.country } catch { "Could not fetch IP info" }',

    // Display
    'display off': 'powershell -Command "(Add-Type -MemberDefinition \'[DllImport(\\\"user32.dll\\\")]public static extern int SendMessage(int h,int m,int w,int l);\' -Name W -Namespace N -PassThru)::SendMessage(-1,0x0112,0xF170,2)"',

    // Volume level
    'get volume': '$vol = [audio]::Volume; try { Add-Type -TypeDefinition \'using System.Runtime.InteropServices; [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface IAudioEndpointVolume { void _VtblGap1_6(); void GetMasterVolumeLevelScalar(out float f); } \'; "Volume info unavailable via script. Use volume up/down commands." } catch { "Use: volume up / volume down / volume mute" }',

    // Files
    'recent files': 'Get-ChildItem -Path "$env:USERPROFILE\\Documents","$env:USERPROFILE\\Desktop" -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 10 | ForEach-Object { $_.Name + " (" + $_.LastWriteTime.ToString("MM/dd HH:mm") + ")" }',
    'downloads': 'Get-ChildItem -Path "$env:USERPROFILE\\Downloads" -File | Sort-Object LastWriteTime -Descending | Select-Object -First 10 | ForEach-Object { $_.Name }',

    // Linux-style aliases
    'free': '$o=Get-WmiObject Win32_OperatingSystem; "Total: "+[math]::Round($o.TotalVisibleMemorySize/1024,0)+"MB | Free: "+[math]::Round($o.FreePhysicalMemory/1024,0)+"MB"',
    'free -m': '$o=Get-WmiObject Win32_OperatingSystem; "Total: "+[math]::Round($o.TotalVisibleMemorySize/1024,0)+"MB | Free: "+[math]::Round($o.FreePhysicalMemory/1024,0)+"MB"',
};

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ ok: true, hostname: os.hostname(), platform: os.platform(), uptime: Math.floor(os.uptime()) + 's' });
});

app.get('/commands', (req, res) => {
    res.json({ commands: Object.keys(COMMANDS) });
});

app.post('/execute', (req, res) => {
    const raw = String(req.body?.command || '').trim().toLowerCase();
    if (!raw) return res.status(400).json({ success: false, error: 'No command provided.' });

    // Screenshot handled separately — returns base64 image
    if (raw === 'screenshot') {
        return takeScreenshot(res);
    }

    const psCommand = COMMANDS[raw];
    if (!psCommand) {
        return res.status(403).json({ success: false, error: `Command "${raw}" is not whitelisted.`, allowed: Object.keys(COMMANDS) });
    }

    console.log(`[CMD] → ${raw}`);
    const fullCmd = `try { ${psCommand} } catch { "Error: " + $_.Exception.Message }`;
    const encoded = Buffer.from(fullCmd, 'utf16le').toString('base64');
    exec(`powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
        { timeout: 10000 },
        (error, stdout, stderr) => {
            if (error && !stdout) {
                console.error(`[ERR] ${error.message}`);
                return res.json({ success: false, result: stderr?.trim() || error.message });
            }
            const output = stdout.trim() || 'Command completed (no output).';
            console.log(`[OUT] ${output.slice(0, 120)}`);
            res.json({ success: true, result: output });
        }
    );
});

// ─── Screenshot ───────────────────────────────────────────────────────────────
function takeScreenshot(res) {
    console.log('[CMD] → screenshot');
    const psScript = `
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$g.Dispose()
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Dispose()
[Convert]::ToBase64String($ms.ToArray())
`.trim();

    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    exec(`powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
        { timeout: 20000, maxBuffer: 50 * 1024 * 1024 }, // 50MB buffer for image data
        (error, stdout, stderr) => {
            if (error && !stdout) {
                console.error(`[Screenshot ERR] ${error.message}`);
                return res.json({ success: false, result: stderr?.trim() || error.message });
            }
            const base64 = stdout.trim();
            if (!base64) return res.json({ success: false, result: 'Screenshot returned empty data.' });
            console.log(`[Screenshot] captured (${Math.round(base64.length / 1024)}KB base64)`);
            res.json({ success: true, result: base64, type: 'image', mimeType: 'image/jpeg' });
        }
    );
}



// ─── Tunnel Launcher ─────────────────────────────────────────────────────────

/** Ngrok — auto-start if NGROK_AUTHTOKEN is set in start.bat */
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
    console.log('     2. Edit start.bat and set: NGROK_AUTHTOKEN=your_token');
    console.log('     3. Run: npm install @ngrok/ngrok');
    console.log('');
    console.log('   Option B — Manual Ngrok (no config):');
    console.log(`     Run in a new terminal: ngrok http ${PORT}`);
    console.log('');
    console.log('   Then paste the printed URL into: Jarvis Dashboard → Settings → Personal VM URL\n');
}

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║        JARVIS DESKTOP AGENT              ║');
    console.log(`║        Running on port ${PORT}             ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log(`\n✅ Local:    http://localhost:${PORT}`);
    console.log(`📋 Commands: ${Object.keys(COMMANDS).length} whitelisted`);
    await startTunnel();
});

