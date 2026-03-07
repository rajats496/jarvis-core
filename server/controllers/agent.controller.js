/**
 * Agent Download Controller
 * Streams a zip of the Desktop Agent files directly to the client.
 * GET /agent/download?platform=windows|mac
 */
const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream');

// Root of the project (two levels up from server/controllers/)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const AGENT_DIR = path.join(PROJECT_ROOT, 'desktop-agent');

// Files to include per platform
const WINDOWS_FILES = [
    { disk: 'agent.js', zip: 'jarvis-agent-windows/agent.js' },
    { disk: 'start.bat', zip: 'jarvis-agent-windows/start.bat' },
    { disk: 'package.json', zip: 'jarvis-agent-windows/package.json' },
    { disk: 'SETUP.md', zip: 'jarvis-agent-windows/SETUP.md' },
];

const MAC_FILES = [
    { disk: 'agent-mac.js', zip: 'jarvis-agent-mac/agent.js' },
    { disk: 'start.sh', zip: 'jarvis-agent-mac/start.sh' },
    { disk: 'package.json', zip: 'jarvis-agent-mac/package.json' },
    { disk: 'SETUP.md', zip: 'jarvis-agent-mac/SETUP.md' },
];

async function downloadAgent(req, res) {
    const platform = (req.query.platform || 'windows').toLowerCase();
    const isMac = platform === 'mac';
    const files = isMac ? MAC_FILES : WINDOWS_FILES;
    const zipName = isMac ? 'jarvis-agent-mac.zip' : 'jarvis-agent-windows.zip';

    // Verify all files exist before streaming
    for (const f of files) {
        const full = path.join(AGENT_DIR, f.disk);
        if (!fs.existsSync(full)) {
            return res.status(500).json({ error: `Agent file not found: ${f.disk}` });
        }
    }

    try {
        const archiver = require('archiver');

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            console.error('[AgentDownload] Archive error:', err);
            if (!res.headersSent) res.status(500).json({ error: 'Failed to create zip.' });
        });

        archive.pipe(res);

        for (const f of files) {
            archive.file(path.join(AGENT_DIR, f.disk), { name: f.zip });
        }

        await archive.finalize();
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            return res.status(500).json({
                error: 'archiver package not installed. Run: npm install archiver  (in server/)',
            });
        }
        console.error('[AgentDownload]', err);
        res.status(500).json({ error: 'Download failed.' });
    }
}

module.exports = { downloadAgent };
