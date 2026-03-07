/**
 * Chat routes - POST /chat (protected)
 */

const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

router.post('/', authMiddleware, chatController.chat);

module.exports = router;
