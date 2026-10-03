const Category = require('../models/Category');
const Photo = require('../models/Photo');

async function listCategories(req, res) {
  const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
  const counts = await Photo.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json(
    categories.map((c) => ({ ...c, photoCount: countMap[String(c._id)] || 0 }))
  );
}

async function createCategory(req, res) {
  const { name, order } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
  const category = await Category.create({ name: name.trim(), order: order ?? 0 });
  res.status(201).json(category);
}

async function updateCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  const { name, order } = req.body || {};
  if (name !== undefined) category.name = name.trim();
  if (order !== undefined) category.order = order;
  await category.save();
  res.json(category);
}

async function deleteCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  const inUse = await Photo.countDocuments({ category: category._id });
  if (inUse > 0) {
    return res
      .status(409)
      .json({ message: `Category has ${inUse} photo(s). Move or delete them first.` });
  }
  await category.deleteOne();
  res.json({ message: 'Category deleted' });
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
