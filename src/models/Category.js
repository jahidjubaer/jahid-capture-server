const mongoose = require('mongoose');

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function () {
  if (this.name) this.slug = slugify(this.name);
});

module.exports = mongoose.model('Category', categorySchema);
