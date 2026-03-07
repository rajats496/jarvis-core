/**
 * Environment validation - check required env vars on startup
 */
const logger = require('./logger');

const REQUIRED = [
  { key: 'MONGODB_URI', description: 'MongoDB connection string' },
  { key: 'JWT_SECRET', description: 'JWT signing secret' },
];

const RECOMMENDED = [
  { key: 'GROQ_API_KEY', description: 'Groq API key for AI features' },
  { key: 'OPENAI_API_KEY', description: 'OpenAI API key for embeddings' },
];

function validate() {
  const missing = [];
  const warnings = [];

  for (const { key, description } of REQUIRED) {
    if (!process.env[key] || !process.env[key].trim()) {
      missing.push(`${key} (${description})`);
    }
  }

  for (const { key, description } of RECOMMENDED) {
    if (!process.env[key] || !process.env[key].trim()) {
      warnings.push(`${key} (${description}) - feature will be disabled`);
    }
  }

  if (missing.length > 0) {
    logger.error('❌ Missing required environment variables:');
    missing.forEach((m) => logger.error(`  - ${m}`));
    logger.error('Server cannot start. Set these variables in .env file.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    logger.warn('⚠️  Missing optional environment variables:');
    warnings.forEach((w) => logger.warn(`  - ${w}`));
  }

  logger.info('✓ Environment validation passed');
}

module.exports = { validate };
