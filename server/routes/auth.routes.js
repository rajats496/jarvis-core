/**
 * Auth routes - Register, Login, protected /me, token refresh
 */

const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/refresh', authMiddleware, authController.refresh);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
