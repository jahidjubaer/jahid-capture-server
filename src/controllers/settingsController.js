const mongoose = require('mongoose');
const Setting = require('../models/Setting');

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);

async function getSettings(req, res) {
  const settings = await Setting.getSingleton();
  res.json(settings);
}

async function updateSettings(req, res) {
  const settings = await Setting.getSingleton();
  const { tagline, email, location, availableFor, socials, about, story } = req.body || {};

  if (tagline !== undefined) settings.tagline = tagline.trim();
  if (email !== undefined) settings.email = email.trim();
  if (location !== undefined) settings.location = location.trim();
  if (availableFor !== undefined) settings.availableFor = availableFor.trim();
  if (socials && typeof socials === 'object') {
    for (const key of ['instagram', 'youtube', 'facebook', 'x']) {
      if (socials[key] !== undefined) settings.socials[key] = String(socials[key]).trim();
    }
  }

  if (about && typeof about === 'object') {
    if (about.quote !== undefined) settings.about.quote = str(about.quote);
    if (about.bio !== undefined) settings.about.bio = list(about.bio, 10).map(str).filter(Boolean);
    if (about.focusAreas !== undefined) {
      settings.about.focusAreas = list(about.focusAreas, 8)
        .map((a) => ({ title: str(a?.title), text: str(a?.text) }))
        .filter((a) => a.title);
    }
  }
  if (story && typeof story === 'object') {
    if (story.subtitle !== undefined) settings.story.subtitle = str(story.subtitle);
    if (story.chapters !== undefined) {
      settings.story.chapters = list(story.chapters, 20)
        .map((c) => ({
          year: str(c?.year),
          title: str(c?.title),
          text: str(c?.text),
          photo: mongoose.isValidObjectId(c?.photo) ? c.photo : null,
        }))
        .filter((c) => c.title || c.text);
    }
  }

  await settings.save();
  res.json(settings);
}

module.exports = { getSettings, updateSettings };
