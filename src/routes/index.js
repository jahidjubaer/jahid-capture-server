const express = require('express');
const rateLimit = require('express-rate-limit');
const requireAdmin = require('../middleware/auth');
const upload = require('../middleware/upload');
const { login, me } = require('../controllers/authController');
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const {
  listPhotos,
  createPhoto,
  updatePhoto,
  reorderPhotos,
  deletePhoto,
} = require('../controllers/photoController');
const {
  listSeries,
  getSeries,
  createSeries,
  updateSeries,
  deleteSeries,
} = require('../controllers/seriesController');
const { getStats } = require('../controllers/statsController');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = express.Router();

// 10 failed login attempts per IP per 15 minutes; successful logins don't count
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many login attempts, try again in 15 minutes' },
});

// auth
router.post('/auth/login', loginLimiter, login);
router.get('/auth/me', requireAdmin, me);

// categories
router.get('/categories', listCategories);
router.post('/categories', requireAdmin, createCategory);
router.put('/categories/:id', requireAdmin, updateCategory);
router.delete('/categories/:id', requireAdmin, deleteCategory);

// photos
router.get('/photos', listPhotos);
router.post('/photos', requireAdmin, upload.single('image'), createPhoto);
router.put('/photos/reorder', requireAdmin, reorderPhotos); // must precede /photos/:id
router.put('/photos/:id', requireAdmin, updatePhoto);
router.delete('/photos/:id', requireAdmin, deletePhoto);

// series
router.get('/series', listSeries);
router.get('/series/:slug', getSeries);
router.post('/series', requireAdmin, createSeries);
router.put('/series/:id', requireAdmin, updateSeries);
router.delete('/series/:id', requireAdmin, deleteSeries);

// stats
router.get('/stats', requireAdmin, getStats);

// site settings
router.get('/settings', getSettings);
router.put('/settings', requireAdmin, updateSettings);

module.exports = router;
