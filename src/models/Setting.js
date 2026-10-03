const mongoose = require('mongoose');

// Defaults = the copy that used to be hard-coded in About.jsx / Story.jsx.
const DEFAULT_BIO = [
  "I'm Jahid — a photographer based in Bangladesh, chasing light, texture, and honest moments. From the lakes and haors of Sunamganj to quiet street corners and unguarded portraits, my work is about slowing down and noticing the world as it actually is.",
  'This portfolio is a living collection of the frames I care about most. New work is added regularly, so come back often.',
];
const DEFAULT_FOCUS = [
  { title: 'Landscape', text: 'Wide horizons, dramatic light, patient waiting for the moment.' },
  { title: 'Portrait', text: 'Honest faces and quiet expressions, shot with natural light.' },
  { title: 'Street', text: 'Unscripted city life — geometry, shadow, and timing.' },
  { title: 'Travel', text: 'Places and people, documented as they are.' },
];
const DEFAULT_CHAPTERS = [
  {
    year: 'The Beginning',
    title: 'A Borrowed Camera',
    text: 'It started in Bangladesh with a borrowed camera and a walk through my own neighborhood. The first frames were nothing special — but the feeling of freezing a moment was. I was hooked before the day was done.',
  },
  {
    year: 'Learning',
    title: 'Ten Thousand Bad Photos',
    text: 'Every free hour went into shooting, failing, and shooting again. Blown highlights, missed focus, crooked horizons — each mistake taught me something a tutorial never could.',
  },
  {
    year: 'Finding a Voice',
    title: 'Chasing Light',
    text: 'Somewhere along the way the gear stopped mattering and the light became everything. Dawn over the still water of Niladri Lake in Sunamganj, monsoon clouds stacking over the haors, a single lit window on a dark street — I learned to wait for the moment instead of forcing it.',
  },
  {
    year: 'Today',
    title: 'Telling Stories',
    text: 'Now every frame starts with a question: what is this picture trying to say? From landscapes to street corners to faces, this site is the ongoing answer — a collection that grows with every shoot.',
  },
];

const textBlock = new mongoose.Schema(
  { title: { type: String, default: '' }, text: { type: String, default: '' } },
  { _id: false }
);
const chapterSchema = new mongoose.Schema(
  {
    year: { type: String, default: '' },
    title: { type: String, default: '' },
    text: { type: String, default: '' },
    // optional photo shown under the chapter; empty = pick one automatically
    photo: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo', default: null },
  },
  { _id: false }
);

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
    about: {
      quote: { type: String, default: 'Every frame is a story waiting to be told.' },
      bio: { type: [String], default: () => DEFAULT_BIO },
      focusAreas: { type: [textBlock], default: () => DEFAULT_FOCUS },
    },
    story: {
      subtitle: {
        type: String,
        default: 'How a first camera turned into a lifelong obsession — chapter by chapter.',
      },
      chapters: { type: [chapterSchema], default: () => DEFAULT_CHAPTERS },
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
