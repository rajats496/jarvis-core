/**
 * Jarvis AI Assistant - Main Backend (Render)
 * Hybrid Intelligence: DB → Source of Truth, Rules → Deterministic, AI → Enhancement
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const envValidator = require('./utils/envValidator');
const { connectDB } = require('./config/db');
const systemRoutes = require('./routes/system.routes');
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const memoryRoutes = require('./routes/memory.routes');
const activityRoutes = require('./routes/activity.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const commandsRoutes = require('./routes/commands.routes');
const remindersRoutes = require('./routes/reminders.routes');
const tasksRoutes = require('./routes/tasks.routes');
const goalsRoutes = require('./routes/goals.routes');
const conversationsRoutes = require('./routes/conversations.routes');
const settingsRoutes = require('./routes/settings.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const vmRoutes = require('./routes/vm.routes');
const agentRoutes = require('./routes/agent.routes');
const errorMiddleware = require('./middleware/error.middleware');
const rateLimitMiddleware = require('./middleware/rateLimit.middleware');
const logger = require('./utils/logger');
const reminderCron = require('./utils/reminderCron');

// Validate environment before starting
envValidator.validate();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — restrict to specific origins in production
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) or whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimitMiddleware);

// Routes
app.use('/system', systemRoutes);
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/memory', memoryRoutes);
app.use('/activity', activityRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/commands', commandsRoutes);
app.use('/reminders', remindersRoutes);
app.use('/tasks', tasksRoutes);
app.use('/goals', goalsRoutes);
app.use('/conversations', conversationsRoutes);
app.use('/settings', settingsRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/vm', vmRoutes);
app.use('/agent', agentRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use(errorMiddleware);

// Start server after DB connect
async function start() {
  try {
    await connectDB();
    reminderCron.start();
    app.listen(PORT, () => {
      logger.info(`Jarvis backend running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
