// One-off: create the 9:16 phone crop (mobileUrl) for photos uploaded before it existed.
// Reads each photo's full image (Blob URL or local /uploads path) and saves the crop
// through the same storage as uploads. Needs BLOB_READ_WRITE_TOKEN for Blob (.env.local).
// Usage: node src/scripts/backfill-mobile.js   (add --all to regenerate every photo)
require('dotenv').config({ path: ['.env', '.env.local'], quiet: true });
const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Photo = require('../models/Photo');
const { saveFile } = require('../config/storage');
const mobileCrop = require('../utils/mobileCrop');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

async function readImage(url) {
  if (/^https?:\/\//.test(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFile(path.join(UPLOAD_ROOT, url.replace(/^\/uploads\//, '')));
}

async function run() {
  await connectDB();
  const all = process.argv.includes('--all');
  const photos = await Photo.find(all ? {} : { $or: [{ mobileUrl: '' }, { mobileUrl: null }] });
  console.log(`Photos to process: ${photos.length}`);

  for (const photo of photos) {
    try {
      const crop = await mobileCrop(await readImage(photo.imageUrl));
      // reuse the full image's file id so keys stay recognisable
      const id = path.basename(photo.imageUrl).replace(/\.webp$/, '');
      photo.mobileUrl = await saveFile(`mobile/${id}_mobile.webp`, crop);
      await photo.save();
      console.log(`✓ ${photo.title} (${Math.round(crop.length / 1024)} KB)`);
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
