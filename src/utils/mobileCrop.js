const sharp = require('sharp');

// Portrait 9:16 version for phone screens (used by the full-screen hero).
// `entropy` keeps the most detailed region in frame — compared on the real photos
// it kept boatmen, horse + rider and the tea maker, where `attention` chased
// bright sky and a centre crop cut subjects off. Never upscales: a 2560×1440 landscape
// becomes 810×1440, a tall portrait tops out at 1080×1920.
const MAX_HEIGHT = 1920;
const RATIO = 9 / 16;

async function mobileCrop(input) {
  const image = sharp(input).rotate(); // respect EXIF orientation
  const { width, height } = await image.clone().metadata().then((meta) =>
    // metadata() reports pre-rotation size; swap for 90°/270° EXIF orientations
    meta.orientation >= 5 ? { width: meta.height, height: meta.width } : meta
  );

  const targetHeight = Math.round(Math.min(MAX_HEIGHT, height, width / RATIO));
  const targetWidth = Math.round(targetHeight * RATIO);

  return image
    .resize(targetWidth, targetHeight, { fit: 'cover', position: sharp.strategy.entropy })
    .webp({ quality: 80 })
    .toBuffer();
}

module.exports = mobileCrop;
