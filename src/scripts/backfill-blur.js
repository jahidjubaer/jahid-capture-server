// One-off: generate blurDataUrl for photos uploaded before the blur-up feature.
require('dotenv').config();
const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Photo = require('../models/Photo');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

async function run() {
  await connectDB();
  const photos = await Photo.find({ $or: [{ blurDataUrl: '' }, { blurDataUrl: null }] });
  console.log(`Photos missing blur placeholder: ${photos.length}`);
  for (const photo of photos) {
    const filePath = path.join(UPLOAD_ROOT, photo.imageUrl.replace(/^\/uploads\//, ''));
    try {
      const buffer = await fs.readFile(filePath);
      const blur = await sharp(buffer).resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
      photo.blurDataUrl = `data:image/webp;base64,${blur.toString('base64')}`;
      await photo.save();
      console.log(`✓ ${photo.title}`);
    } catch (err) {
      console.warn(`✗ ${photo.title}: ${err.message}`);
    }
  }
  await mongoose.disconnect();
  console.log('Backfill complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
