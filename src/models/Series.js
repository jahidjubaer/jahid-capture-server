const mongoose = require('mongoose');

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// A curated set of photos told as one story (e.g. "Sunamganj Monsoon 2025").
// Photos point at their series via Photo.series.
const seriesSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },
    subtitle: { type: String, default: '', trim: true }, // short label, e.g. place · year
    description: { type: String, default: '', trim: true },
    // cover image; empty = first photo in the series
    cover: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo', default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

seriesSchema.pre('validate', function () {
  if (this.title) this.slug = slugify(this.title);
});

module.exports = mongoose.model('Series', seriesSchema);
