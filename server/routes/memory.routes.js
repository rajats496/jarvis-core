/**
 * Memory routes - structured memory CRUD + search. All protected.
 */

const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const memoryController = require('../controllers/memory.controller');

const router = express.Router();

router.use(authMiddleware);

router.post('/', memoryController.create);
router.get('/', memoryController.list);
router.get('/export', memoryController.exportData);
router.get('/categories', memoryController.categories);
router.get('/search', memoryController.search);
router.get('/preferences', memoryController.preferences);
router.get('/:id', memoryController.getOne);
router.put('/:id', memoryController.update);
router.delete('/:id', memoryController.remove);

module.exports = router;
