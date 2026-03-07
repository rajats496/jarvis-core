/**
 * Part 8 - VM command execution. Auth required; safe mode and whitelist enforced in service.
 */
const vmProxyService = require('../services/vmProxy.service');

async function execute(req, res, next) {
  try {
    const userId = req.user.id;
    const command = req.body?.command;
    if (command === undefined || command === null) {
      return res.status(400).json({ error: 'command (string) is required' });
    }
    const { success, result } = await vmProxyService.execute(userId, String(command));
    res.json({ success, result });
  } catch (err) {
    next(err);
  }
}

module.exports = { execute };
