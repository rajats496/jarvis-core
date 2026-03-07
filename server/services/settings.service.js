/**
 * Part 7 - User settings service. Get/update per-user settings.
 */
const Settings = require('../models/Settings');

const DEFAULTS = {
  voiceEnabled: true,
  fallbackModeEnabled: false,
  safeModeEnabled: true,
  conciseResponses: false,
  showSystemMetrics: false,
  vmUrl: '',
};

async function get(userId) {
  let doc = await Settings.findOne({ userId }).lean();
  if (!doc) {
    doc = await Settings.create({ userId, ...DEFAULTS });
    doc = doc.toObject ? doc.toObject() : doc;
  }
  const { _id, userId: uid, ...rest } = doc;
  return { id: _id, userId: uid, ...DEFAULTS, ...rest };
}

async function update(userId, body) {
  let doc = await Settings.findOne({ userId });
  if (!doc) {
    doc = await Settings.create({ userId, ...DEFAULTS });
  }
  if (typeof body.voiceEnabled === 'boolean') doc.voiceEnabled = body.voiceEnabled;
  if (typeof body.fallbackModeEnabled === 'boolean') doc.fallbackModeEnabled = body.fallbackModeEnabled;
  if (typeof body.safeModeEnabled === 'boolean') doc.safeModeEnabled = body.safeModeEnabled;
  if (typeof body.conciseResponses === 'boolean') doc.conciseResponses = body.conciseResponses;
  if (typeof body.showSystemMetrics === 'boolean') doc.showSystemMetrics = body.showSystemMetrics;
  if (typeof body.vmUrl === 'string') doc.vmUrl = body.vmUrl;
  await doc.save();
  return get(userId);
}

module.exports = { get, update };
