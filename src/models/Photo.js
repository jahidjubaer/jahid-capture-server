const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    series: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', default: null, index: true },
    imageUrl: { type: String, required: true },
    thumbUrl: { type: String, required: true },
    blurDataUrl: { type: String, default: '' },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    featured: { type: Boolean, default: false },
    // the homepage hero image — at most one photo has this set
    hero: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Photo', photoSchema);
