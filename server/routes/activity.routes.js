const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const activityController = require('../controllers/activity.controller');

const router = express.Router();
router.use(authMiddleware);
router.get('/timeline', activityController.getTimeline);

module.exports = router;
