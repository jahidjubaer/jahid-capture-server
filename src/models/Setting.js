const mongoose = require('mongoose');

// Singleton document holding site-wide editable settings.
const settingSchema = new mongoose.Schema(
  {
    tagline: { type: String, default: 'Photographer & Visual Storyteller' },
    email: { type: String, default: 'jahidjubaer17@gmail.com' },
    location: { type: String, default: 'Bangladesh' },
    availableFor: { type: String, default: 'Commissions · Collaborations · Prints' },
    socials: {
      instagram: { type: String, default: 'https://www.instagram.com/jahid-capture' },
      youtube: { type: String, default: '' },
      facebook: { type: String, default: '' },
      x: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

settingSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('Setting', settingSchema);
