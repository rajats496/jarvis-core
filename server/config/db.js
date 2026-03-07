/**
 * MongoDB connection - Source of Truth for Jarvis
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required in environment');
  }
  await mongoose.connect(uri);
  isConnected = true;
  logger.info('MongoDB connected');
  mongoose.connection.on('error', (err) => logger.error('MongoDB error', err));
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected');
  });
}

module.exports = { connectDB };
