/**
 * Part 8 - VM command routes. All protected.
 */
const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const loadGuard = require('../utils/loadGuard');
const vmController = require('../controllers/vm.controller');

const router = express.Router();
router.use(authMiddleware);

router.post('/execute', (req, res, next) => {
  if (!loadGuard.isUnderLoad()) {
    return res.status(503).json({
      error: 'Safe mode active. VM commands disabled due to high load.',
      safeMode: true,
    });
  }
  vmController.execute(req, res, next);
});

module.exports = router;
