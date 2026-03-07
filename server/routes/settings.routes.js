/**
 * Part 7 - Settings routes. All protected.
 */
const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const settingsController = require('../controllers/settings.controller');

const router = express.Router();
router.use(authMiddleware);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;
