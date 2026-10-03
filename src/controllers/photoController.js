const crypto = require('crypto');
const sharp = require('sharp');
const Photo = require('../models/Photo');
const Category = require('../models/Category');
const { saveFile, deleteFile } = require('../config/storage');

async function listPhotos(req, res) {
  const filter = {};
  if (req.query.category) {
    const category = await Category.findOne({ slug: req.query.category });
    if (!category) return res.json([]);
    filter.category = category._id;
  }
  if (req.query.featured === 'true') filter.featured = true;
  const photos = await Photo.find(filter)
    .sort({ order: 1, createdAt: -1 })
    .populate('category', 'name slug')
    .lean();
  res.json(photos);
}

async function createPhoto(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Image file is required' });
  const { title, description = '', category: categoryId, featured } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ message: 'Title is required' });

  const category = await Category.findById(categoryId);
  if (!category) return res.status(400).json({ message: 'Valid category is required' });

  const id = crypto.randomBytes(8).toString('hex');
  const fullName = `${id}.webp`;
  const thumbName = `${id}_thumb.webp`;

  const image = sharp(req.file.buffer).rotate(); // respect EXIF orientation
  const fullBuffer = await image
    .clone()
    .resize(2560, 2560, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const fullMeta = await sharp(fullBuffer).metadata();

  const thumbBuffer = await image
    .clone()
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();

  // tiny blurred placeholder, inlined as a data URL for instant paint
  const blurBuffer = await image
    .clone()
    .resize({ width: 24 })
    .webp({ quality: 40 })
    .toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

  const [imageUrl, thumbUrl] = await Promise.all([
    saveFile(`full/${fullName}`, fullBuffer),
    saveFile(`thumbs/${thumbName}`, thumbBuffer),
  ]);

  const photo = await Photo.create({
    title: title.trim(),
    description: description.trim(),
    category: category._id,
    imageUrl,
    thumbUrl,
    blurDataUrl,
    width: fullMeta.width,
    height: fullMeta.height,
    featured: featured === 'true' || featured === true,
  });
  await photo.populate('category', 'name slug');
  res.status(201).json(photo);
}

async function updatePhoto(req, res) {
  const photo = await Photo.findById(req.params.id);
  if (!photo) return res.status(404).json({ message: 'Photo not found' });

  const { title, description, category: categoryId, featured, order } = req.body || {};
  if (title !== undefined) photo.title = title.trim();
  if (description !== undefined) photo.description = description.trim();
  if (featured !== undefined) photo.featured = featured === true || featured === 'true';
  if (order !== undefined) photo.order = order;
  if (categoryId !== undefined) {
    const category = await Category.findById(categoryId);
    if (!category) return res.status(400).json({ message: 'Valid category is required' });
    photo.category = category._id;
  }
  await photo.save();
  await photo.populate('category', 'name slug');
  res.json(photo);
}

async function reorderPhotos(req, res) {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids array is required' });
  }
  await Photo.bulkWrite(
    ids.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { order: index } },
    }))
  );
  res.json({ message: 'Order updated' });
}

async function deletePhoto(req, res) {
  const photo = await Photo.findById(req.params.id);
  if (!photo) return res.status(404).json({ message: 'Photo not found' });

  await Promise.all([deleteFile(photo.imageUrl), deleteFile(photo.thumbUrl)]);
  await photo.deleteOne();
  res.json({ message: 'Photo deleted' });
}

module.exports = { listPhotos, createPhoto, updatePhoto, reorderPhotos, deletePhoto };
