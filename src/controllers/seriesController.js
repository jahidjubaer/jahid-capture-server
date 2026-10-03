const mongoose = require('mongoose');
const Series = require('../models/Series');
const Photo = require('../models/Photo');

const PHOTO_SORT = { order: 1, createdAt: -1 };
const COVER_FIELDS = 'title thumbUrl imageUrl blurDataUrl width height';

// public list: each series with its photo count and resolved cover photo
async function listSeries(req, res) {
  const series = await Series.find().sort({ order: 1, createdAt: -1 }).lean();
  const result = await Promise.all(
    series.map(async (s) => {
      const photoCount = await Photo.countDocuments({ series: s._id });
      const cover =
        (s.cover && (await Photo.findById(s.cover).select(COVER_FIELDS).lean())) ||
        (await Photo.findOne({ series: s._id }).sort(PHOTO_SORT).select(COVER_FIELDS).lean());
      // coverId = the explicit pick (null = automatic), cover = the photo actually shown
      return { ...s, photoCount, coverId: s.cover, cover: cover || null };
    })
  );
  res.json(result);
}

async function getSeries(req, res) {
  const series = await Series.findOne({ slug: req.params.slug }).lean();
  if (!series) return res.status(404).json({ message: 'Series not found' });
  const photos = await Photo.find({ series: series._id })
    .sort(PHOTO_SORT)
    .populate('category', 'name slug')
    .lean();
  res.json({ ...series, photos });
}

function applyFields(series, body) {
  const { title, subtitle, description, cover, order } = body || {};
  if (title !== undefined) series.title = String(title).trim();
  if (subtitle !== undefined) series.subtitle = String(subtitle).trim();
  if (description !== undefined) series.description = String(description).trim();
  if (cover !== undefined) series.cover = mongoose.isValidObjectId(cover) ? cover : null;
  if (order !== undefined) series.order = order;
}

async function createSeries(req, res) {
  if (!req.body?.title || !String(req.body.title).trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }
  const series = new Series();
  applyFields(series, req.body);
  await series.save();
  res.status(201).json(series);
}

async function updateSeries(req, res) {
  const series = await Series.findById(req.params.id);
  if (!series) return res.status(404).json({ message: 'Series not found' });
  applyFields(series, req.body);
  await series.save();
  res.json(series);
}

// deleting a series keeps its photos — they just leave the series
async function deleteSeries(req, res) {
  const series = await Series.findById(req.params.id);
  if (!series) return res.status(404).json({ message: 'Series not found' });
  await Photo.updateMany({ series: series._id }, { series: null });
  await series.deleteOne();
  res.json({ message: 'Series deleted' });
}

module.exports = { listSeries, getSeries, createSeries, updateSeries, deleteSeries };
