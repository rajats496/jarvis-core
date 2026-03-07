const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const tasksController = require('../controllers/tasks.controller');

const router = express.Router();
router.use(authMiddleware);

router.get('/', tasksController.list);
router.post('/', tasksController.create);
router.patch('/:id/done', tasksController.markDone);
router.delete('/:id', tasksController.deleteTask);

module.exports = router;
