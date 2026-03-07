/**
 * Part 7 - Settings API. Get/update user settings.
 */
const settingsService = require('../services/settings.service');

async function getSettings(req, res, next) {
  try {
    const userId = req.user.id;
    const settings = await settingsService.get(userId);
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const userId = req.user.id;
    const settings = await settingsService.update(userId, req.body || {});
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings };
