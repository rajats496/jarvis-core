const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const goalsController = require('../controllers/goals.controller');

const router = express.Router();
router.use(authMiddleware);
router.get('/',            goalsController.list);
router.post('/',           goalsController.create);
router.delete('/:id',      goalsController.deleteGoal);
router.patch('/:id/progress', goalsController.updateProgress);

module.exports = router;
