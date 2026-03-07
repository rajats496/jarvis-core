/**
 * System routes - health and status
 */

const express = require('express');
const systemController = require('../controllers/system.controller');

const router = express.Router();

router.get('/health', systemController.getHealth);
router.get('/status', systemController.getStatus);

module.exports = router;
