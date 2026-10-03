const path = require('path');
const fs = require('fs/promises');

// Vercel Blob when BLOB_READ_WRITE_TOKEN is set (production on Vercel),
// local server/uploads/ otherwise (dev without a token).
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

// key like "full/abc.webp" → public URL
async function saveFile(key, buffer, contentType = 'image/webp') {
  if (useBlob) {
    const { put } = require('@vercel/blob');
    const blob = await put(key, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true, // keys are random ids; lets backfills regenerate a file
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return blob.url;
  }
  const filePath = path.join(UPLOAD_ROOT, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return `/uploads/${key}`;
}

async function deleteFile(url) {
  if (!url) return;
  if (/^https?:\/\//.test(url)) {
    if (!useBlob) return;
    const { del } = require('@vercel/blob');
    await del(url).catch(() => {});
    return;
  }
  await fs.unlink(path.join(UPLOAD_ROOT, url.replace(/^\/uploads\//, ''))).catch(() => {});
}

module.exports = { saveFile, deleteFile, useBlob };
