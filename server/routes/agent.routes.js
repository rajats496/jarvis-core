const express = require('express');
const router = express.Router();
const { downloadAgent } = require('../controllers/agent.controller');

// GET /agent/download?platform=windows|mac
// Public route — agent files are not sensitive (just Node.js scripts)
router.get('/download', downloadAgent);

module.exports = router;
