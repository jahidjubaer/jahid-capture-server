// One-off: copy the local MongoDB + server/uploads/ photos to Atlas + Vercel Blob.
// Usage: SOURCE_URI=mongodb://127.0.0.1:27017/jahid-capture node src/scripts/migrate-to-cloud.js
// Needs MONGODB_URI (target) and BLOB_READ_WRITE_TOKEN in .env / .env.local.
// Safe to re-run: documents are upserted by _id, blobs overwrite the same key.
require('dotenv').config({ quiet: true });
require('dotenv').config({ path: '.env.local', quiet: true });
const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');
const { put } = require('@vercel/blob');

const SOURCE_URI = process.env.SOURCE_URI || 'mongodb://127.0.0.1:27017/jahid-capture';
const TARGET_DB = process.env.MONGODB_DB || 'jahid-capture';
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const COLLECTIONS = ['admins', 'categories', 'settings', 'photos'];

async function toBlob(localUrl) {
  if (!localUrl || !localUrl.startsWith('/uploads/')) return localUrl;
  const key = localUrl.replace(/^\/uploads\//, '');
  const buffer = await fs.readFile(path.join(UPLOAD_ROOT, key));
  const blob = await put(key, buffer, {
    access: 'public',
    contentType: 'image/webp',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  return blob.url;
}

async function run() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN missing');
  const source = await mongoose.createConnection(SOURCE_URI).asPromise();
  const target = await mongoose
    .createConnection(process.env.MONGODB_URI, { dbName: TARGET_DB })
    .asPromise();
  console.log(`source ${source.name} → target ${target.name}`);

  for (const name of COLLECTIONS) {
    const docs = await source.db.collection(name).find().toArray();
    for (const [i, doc] of docs.entries()) {
      if (name === 'photos') {
        doc.imageUrl = await toBlob(doc.imageUrl);
        doc.thumbUrl = await toBlob(doc.thumbUrl);
        process.stdout.write(`\r  photos ${i + 1}/${docs.length}`);
      }
      await target.db.collection(name).replaceOne({ _id: doc._id }, doc, { upsert: true });
    }
    if (name === 'photos') process.stdout.write('\n');
    console.log(`${name}: ${docs.length} copied`);
  }

  await source.close();
  await target.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
