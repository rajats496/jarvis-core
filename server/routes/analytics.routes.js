/**
 * Part 7 - Analytics routes. All protected.
 */
const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();
router.use(authMiddleware);

router.get('/', analyticsController.getSummary);

module.exports = router;
