const Setting = require('../models/Setting');

async function getSettings(req, res) {
  const settings = await Setting.getSingleton();
  res.json(settings);
}

async function updateSettings(req, res) {
  const settings = await Setting.getSingleton();
  const { tagline, email, location, availableFor, socials } = req.body || {};

  if (tagline !== undefined) settings.tagline = tagline.trim();
  if (email !== undefined) settings.email = email.trim();
  if (location !== undefined) settings.location = location.trim();
  if (availableFor !== undefined) settings.availableFor = availableFor.trim();
  if (socials && typeof socials === 'object') {
    for (const key of ['instagram', 'youtube', 'facebook', 'x']) {
      if (socials[key] !== undefined) settings.socials[key] = String(socials[key]).trim();
    }
  }

  await settings.save();
  res.json(settings);
}

module.exports = { getSettings, updateSettings };
