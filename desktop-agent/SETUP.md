# Jarvis Desktop Agent — Setup Guide
### (Written for everyone — no tech knowledge needed)

---

## What is this?

The **Desktop Agent** is a small program you run on your own computer.
Once it is running, your Jarvis website can talk to your computer and do things like:
- Check your battery, RAM, disk space
- Open apps like Chrome, Notepad, Spotify
- Lock your screen, mute or unmute volume
- And much more — just by chatting with Jarvis

---

## How to Download

1. Go to your **Jarvis website** and open **Settings**
2. Scroll down to the **Desktop Agent** section
3. Click the button for your computer type:
   - **Windows (.zip)** — if you use a Windows PC
   - **macOS (.zip)** — if you use a Mac
4. A zip file will download. Open/extract it like a normal folder.

---

## Windows Setup

### Part 1 — Run the Agent

1. Open the extracted folder
2. Double-click **start.bat**
3. A black terminal window will open — that means the agent is running
4. **Do not close this window** — keep it open the whole time you use Jarvis

---

### Part 2 — Connect to the Internet via Ngrok (Required)

> **Why do I need this?**
> Your computer does not have a public internet address by itself.
> Ngrok creates a temporary secure link between the internet and your computer.
> **Ngrok is completely free — no credit card needed. But you MUST create an account.**

**Step 1 — Create a free account:**
- Open your browser and go to: **https://ngrok.com**
- Click **Sign Up**
- You can sign up with your email, Google account, or GitHub
- Verify your email if asked

**Step 2 — Get your personal token:**
- After logging in, go to: **https://dashboard.ngrok.com/get-started/your-authtoken**
- You will see a long code that looks like: `2abc123xxxxxxxxxxxxxx_xxxxxxxxxx`
- Click the **Copy** icon next to it

**Step 3 — Add your token to start.bat:**
- Find the **start.bat** file in the agent folder
- Right-click it and choose **Open with Notepad**
- Look for this line:
  ```
  set NGROK_AUTHTOKEN=
  ```
- Paste your token right after the = sign, like this:
  ```
  set NGROK_AUTHTOKEN=2abc123yourtoken...
  ```
- Press **Ctrl + S** to save, then close Notepad

**Step 4 — Install the Ngrok package (only needed once):**
- In the black terminal window, type this and press Enter:
  ```
  npm install @ngrok/ngrok
  ```
- Wait for it to finish (may take a minute)

**Step 5 — Restart the agent:**
- Close the terminal window
- Double-click **start.bat** again
- This time you will see a URL appear, like:
  ```
  YOUR TUNNEL URL: https://abc123.ngrok-free.app
  ```

**Step 6 — Connect Jarvis to your computer:**
- Copy that `https://...` URL from the terminal
- Go to your **Jarvis website → Settings → Personal VM URL**
- Paste the URL there and click Save
- You are done! Now try saying **check battery** in Jarvis chat

> **Note:** The URL changes every time you restart the agent.
> If Jarvis says it cannot reach your computer, just get the new URL from the terminal and paste it into Settings again.

---

### Make it Start Automatically with Windows (Optional)

If you want it to start every time you turn on your PC:

1. Press **Windows key + R** at the same time
2. Type `shell:startup` and press Enter — a folder opens
3. Right-click inside that folder → **New → Shortcut**
4. Browse to your **start.bat** file and select it
5. Click Finish

Now the agent starts by itself every time you log into Windows.

---

## macOS Setup

### Part 1 — Run the Agent

1. Open the extracted folder
2. Open **Terminal** (press Cmd + Space, type Terminal, press Enter)
3. Drag the **start.sh** file into the Terminal window and press Enter
4. If you see "permission denied", first run:
   ```
   chmod +x start.sh
   ```
   Then drag and run it again

---

### Part 2 — Connect to the Internet via Ngrok (Required)

Same as Windows — you must create a free account at https://ngrok.com first.

**Step 1 — Create a free account:**
Go to **https://ngrok.com** → click Sign Up (free, no credit card needed)

**Step 2 — Get your token:**
Go to **https://dashboard.ngrok.com/get-started/your-authtoken** → copy the long token

**Step 3 — Add your token to start.sh:**
- Open **start.sh** in any text editor
- Find this line: `export NGROK_AUTHTOKEN=""`
- Paste your token inside the quotes:
  ```
  export NGROK_AUTHTOKEN="2abc123yourtoken..."
  ```
- Save the file

**Step 4 — Install the Ngrok package (only needed once):**
In Terminal, run:
```
npm install @ngrok/ngrok
```

**Step 5 — Restart the agent:**
Run start.sh again. A `https://...` URL will appear.

**Step 6 — Connect to Jarvis:**
- Copy the URL
- Go to **Jarvis Settings → Personal VM URL** → paste it → Save
- Done! Try saying **check battery** in Jarvis chat

---

## What Can You Say to Jarvis?

Once connected, just type these in the Jarvis chat:

| What to say | What happens |
|---|---|
| check battery | Shows battery level and charging status |
| check cpu | Shows how hard your processor is working |
| check ram | Shows memory usage |
| check disk | Shows available storage space |
| lock screen | Locks your computer |
| mute | Mutes your sound |
| unmute | Unmutes your sound |
| volume up | Increases volume |
| volume down | Decreases volume |
| open chrome | Opens Google Chrome |
| open notepad | Opens Notepad |
| open calculator | Opens Calculator |
| open spotify | Opens Spotify |
| open settings | Opens Windows Settings |
| wifi name | Shows current WiFi network name |
| internet test | Tests your internet connection |
| clipboard | Reads what is on your clipboard |

---

## Troubleshooting

**Jarvis says it cannot reach my computer**
The URL changes every restart. Look at the terminal for the new URL and paste it into Jarvis Settings → Personal VM URL.

**The black window closes immediately (Windows)**
Right-click start.bat and choose **Run as administrator**.

**Permission denied (Mac)**
Run `chmod +x start.sh` in Terminal first, then try again.

**npm is not recognized**
You need to install Node.js first. Go to **https://nodejs.org**, download the LTS version, run the installer, then try again.

---

## Security

- Only the commands listed in the table above are allowed to run — everything else is blocked
- The agent only accepts requests from your logged-in Jarvis account
- Closing the terminal window immediately disconnects the agent
