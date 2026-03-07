# Jarvis Desktop Agent — Setup Guide

## How to Download

Log in to your Jarvis dashboard → **Settings → Desktop Agent section**:
- Click **⊞ Windows (.zip)** — for Windows PCs
- Click ** macOS (.zip)** — for Macs

Extract the zip and follow the steps below for your platform.

---

## Windows Setup

### Step 1: Start the Agent
Double-click **`start.bat`**.
> First run? It will auto-install dependencies.

### Step 2: Set Up Ngrok Tunnel

**Option A — Auto (recommended):**
1. Sign up at https://ngrok.com → get your token from https://dashboard.ngrok.com/authtokens.
2. Open `start.bat` in Notepad, uncomment and fill in:
   ```bat
   set NGROK_AUTHTOKEN=your_ngrok_token_here
   ```
3. Install ngrok package: `npm install @ngrok/ngrok`
4. Re-run `start.bat` — tunnel URL is printed automatically.

**Option B — Manual:**
1. Download `ngrok.exe` from https://ngrok.com/download (Windows 64-bit).
2. Authenticate once (do this only once ever):
   ```
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```
3. Run the agent (`start.bat`), then in a **second** window run:
   ```
   ngrok http 4000
   ```
4. Copy the `https://...ngrok-free.app` URL.

### Step 3: Connect to Jarvis
Paste the URL into **Jarvis Settings → Personal VM URL** and press Enter.

### Auto-Start with Windows
1. Press `Win + R` → type `shell:startup` → Enter.
2. Right-click → `New → Shortcut` → point to `start.bat`.

---

## macOS Setup

### Step 1: Start the Agent
```bash
chmod +x start.sh && ./start.sh
```

### Step 2: Set Up Ngrok Tunnel

**Option A — Auto:**
1. Sign up at https://ngrok.com → get your token from https://dashboard.ngrok.com/authtokens.
2. Open `start.sh`, uncomment and fill:
   ```bash
   export NGROK_AUTHTOKEN="your_ngrok_token_here"
   ```
3. Install: `npm install @ngrok/ngrok`
4. Re-run `./start.sh` — URL is printed automatically.

**Option B — Manual:**
1. Download Ngrok for Mac from https://ngrok.com/download.
2. Authenticate once:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```
3. Run `./start.sh`, then in a second Terminal tab:
   ```bash
   ngrok http 4000
   ```
4. Copy the URL.

### Step 3: Connect to Jarvis
Paste the URL into **Jarvis Settings → Personal VM URL** and press Enter.

### Auto-Start with macOS
System Preferences → General → Login Items → Click `+` → Add `start.sh`.

---

## Available Commands

### 📊 System Info
| Say to Jarvis | 🪟 Windows | 🍎 Mac |
|---|---|---|
| `battery` | ✅ | ✅ |
| `cpu` | ✅ | ✅ |
| `ram` | ✅ | ✅ |
| `disk` / `df -h` | ✅ | ✅ |
| `network` | ✅ | ✅ |
| `hostname` | ✅ | ✅ |
| `os` | ✅ | ✅ |
| `uptime` | ✅ | ✅ |
| `processes` / `list processes` | ✅ | ✅ |
| `status` | ✅ | ✅ |

### ⚡ Power & Screen
| Say to Jarvis | 🪟 Windows | 🍎 Mac |
|---|---|---|
| `lock` / `lock my screen` | ✅ | ✅ |
| `sleep` | ✅ | ✅ |
| `display off` / `screen off` | ✅ | ✅ |
| `battery saver on/off` | ✅ | ✅ |

### 🔊 Volume
| Say to Jarvis | 🪟 Windows | 🍎 Mac |
|---|---|---|
| `volume mute` / `mute` | ✅ | ✅ |
| `volume unmute` / `unmute` | ✅ | ✅ |
| `volume up` / `turn up` | ✅ | ✅ |
| `volume down` / `turn down` | ✅ | ✅ |
| `get volume` | ❌ | ✅ |

### 🚀 App Launchers
| Say to Jarvis | 🪟 Windows | 🍎 Mac |
|---|---|---|
| `open notepad` | ✅ (Notepad) | ✅ (TextEdit) |
| `open calculator` | ✅ | ✅ |
| `open explorer` | ✅ (Explorer) | ✅ (Finder) |
| `open finder` | ❌ | ✅ |
| `open chrome` | ✅ | ✅ |
| `open safari` | ❌ | ✅ |
| `open spotify` | ✅ | ✅ |
| `open vscode` | ✅ | ✅ |
| `open terminal` | ✅ (PowerShell) | ✅ |
| `open settings` | ✅ | ❌ |
| `open paint` | ✅ | ❌ |
| `open task manager` | ✅ | ❌ |
| `open camera` | ✅ | ❌ |

### 📋 Clipboard
| Say to Jarvis | 🪟 Windows | 🍎 Mac |
|---|---|---|
| `clipboard` / `read clipboard` | ✅ | ✅ |
| `clear clipboard` | ✅ | ✅ |

### 🌐 Network Extras
| Say to Jarvis | 🪟 Windows | 🍎 Mac |
|---|---|---|
| `wifi name` | ✅ | ✅ |
| `wifi list` | ✅ | ✅ |
| `internet test` / `ping` | ✅ | ✅ |
| `ip info` | ✅ | ✅ |

### 📁 Files
| Say to Jarvis | 🪟 Windows | 🍎 Mac |
|---|---|---|
| `recent files` | ✅ | ✅ |
| `downloads` | ✅ | ✅ |

---

## Security
- Only commands in the whitelist above can run. Everything else is rejected.
- Set `AGENT_SECRET` in `start.bat`/`start.sh` for an extra password layer.
- Downloads are only available to logged-in Jarvis users.
- Closing the terminal instantly disconnects the agent.
