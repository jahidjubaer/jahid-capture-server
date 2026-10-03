const Photo = require('../models/Photo');
const Category = require('../models/Category');

async function getStats(req, res) {
  const [totalPhotos, totalCategories, featuredPhotos, latest] = await Promise.all([
    Photo.countDocuments(),
    Category.countDocuments(),
    Photo.countDocuments({ featured: true }),
    Photo.findOne().sort({ createdAt: -1 }).select('title createdAt').lean(),
  ]);
  res.json({ totalPhotos, totalCategories, featuredPhotos, latestPhoto: latest || null });
}

module.exports = { getStats };
