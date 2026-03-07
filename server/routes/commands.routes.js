const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const commandHistoryController = require('../controllers/commandHistory.controller');

const router = express.Router();
router.use(authMiddleware);
router.get('/history', commandHistoryController.getHistory);

module.exports = router;
