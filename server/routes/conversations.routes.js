/**
 * Part 6 - Conversation history routes. All protected.
 */
const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const conversationController = require('../controllers/conversation.controller');

const router = express.Router();
router.use(authMiddleware);

router.get('/history', conversationController.getHistory);
router.get('/search', conversationController.search);
router.get('/', conversationController.list);
router.delete('/', conversationController.clearHistory);

module.exports = router;
