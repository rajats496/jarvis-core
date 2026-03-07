const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const remindersController = require('../controllers/reminders.controller');

const router = express.Router();
router.use(authMiddleware);

router.get('/', remindersController.list);
router.post('/', remindersController.create);
router.post('/:id/dismiss', remindersController.dismiss);

module.exports = router;
