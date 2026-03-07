const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const notificationsController = require('../controllers/notifications.controller');

const router = express.Router();
router.use(authMiddleware);
router.get('/', notificationsController.getNotifications);
router.get('/pending', notificationsController.getPending);
router.post('/:id/read', notificationsController.markRead);

module.exports = router;
