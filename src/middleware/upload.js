const multer = require('multer');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported file type. Use JPEG, PNG, WEBP, AVIF or TIFF.'));
  },
});

module.exports = upload;
