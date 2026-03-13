# J.A.R.V.I.S (AI Desktop Assistant)

A powerful, native-feeling AI assistant designed with a custom **Deep Command Center** aesthetic. J.A.R.V.I.S acts as both an intelligent conversational AI and a local system controller, allowing you to control your PC directly from a web dashboard.

## 🌟 Key Features

### 💻 Local Desktop Control (Windows & Mac)
Run local commands securely from any device:
- **System Monitors:** Check battery, memory, RAM, and disk space.
- **Hardware Controls:** Adjust volume, brightness, or lock the screen.
- **App Launchers:** Open Chrome, Notepad, specific folders, and more.
- **Media & Sensors:** Capture screenshots directly to the chat interface or run local network diagnostics.

### 🧠 Persistent AI Memory
- J.A.R.V.I.S continuously learns about you from natural conversations.
- Memories, preferences, and long-term goals are securely stored via MongoDB separate for each authenticated user.

### 🎨 Deep Command Center UI
- Built with React, featuring a "Slate Navy" & "Amber/Gold" tech aesthetic.
- Glassmorphism overlays, custom animations (`skull-pulse`), and fully responsive data dashboards.

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas (Mongoose) + Google OAuth Integration
- **AI Brain:** Groq API (Llama 3.1 8B Instant)
- **Desktop Agent:** Node.js locally via PowerShell (Windows) or simple bash (Mac) wrapped in an Express reverse proxy.
- **Tunneling:** Ngrok (or Cloudflare Tunnels) for secure remote bridging to local hardware.

## 🚀 Setting Up the Development Environment

You will need to run 3 separate processes to have the full system online:

### 1. MongoDB Database & Backend (Server)
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5005
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_jwt_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
```
Run the server:
```bash
npm run dev
```

### 2. The Web Dashboard (Client)
```bash
cd client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5005
```
Run the frontend:
```bash
npm run dev
```

### 3. The Local Hardware Agent (Desktop-Agent)
This script runs directly on the device you want to control.
```bash
cd desktop-agent
npm install
```
Create a `.env` file in the `desktop-agent` directory (Optional):
```env
AGENT_PORT=4000
```
Run the initialization script (it launches both the agent and secure tunnel):
```bash
# On Windows
./start.bat

# On Mac
./start.sh
```

Once the tunnel launches, copy the generated `.ngrok-free.app` URL. 
Log into the Client Dashboard, go to **Settings** > **Agent Settings**, and paste the URL into the **Personal VM URL** field. Setup complete!

## 🔒 Security Architecture

The desktop agent executes powerful root/admin-level scripts on your local machine. Because of this:
- **Zero-Trust Tunnels:** All local commands hide behind a randomized Ngrok tunnel.
- **Agent Secrets:** Only the authenticated master backend user can pair an agent via a cryptographically matching `x-agent-secret` header.
- **RBAC:** Multi-tenant architecture guarantees users cannot trigger commands on paths belonging to other users.

## 🧑‍💻 Contributing / Future Roadmap
- Integration with Cloudflare Tunnels.
- Direct webcam captures and optical character recognition (OCR) over local UI elements.
- Granular permissions per-command inside settings.

## 🛟 Troubleshooting & Guides

| Guide | Description |
|-------|-------------|
| [COPILOT_VSCODE_TROUBLESHOOTING.md](./COPILOT_VSCODE_TROUBLESHOOTING.md) | Resolve VS Code model picker issues for Sonnet/Opus models |
| [CONVERSATION_SEARCH.md](./CONVERSATION_SEARCH.md) | How to use and extend the conversation search feature |
| [USAGE_ANALYTICS.md](./USAGE_ANALYTICS.md) | Usage analytics feature overview and architecture |
