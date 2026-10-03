require('dotenv').config({ path: ['.env', '.env.local'], quiet: true }); // .env.local: Blob token from `vercel env pull`
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');

if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error('JWT_SECRET must be set to at least 32 characters in production.');
  process.exit(1);
}

// behind a host proxy (Render/Railway/nginx) so rate limiting sees the real client IP
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'script-src': ["'self'", 'https://cdn.jsdelivr.net'], // browser-image-compression worker
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'blob:'],
        'worker-src': ["'self'", 'blob:'],
      },
    },
  })
);
app.use(cors(isProd && process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN } : undefined));
app.use(express.json());
app.use(morgan(isProd ? 'combined' : 'dev'));

app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    maxAge: '30d',
    immutable: true,
  })
);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
// lazy, cached connection — works both as a long-running server and on Vercel functions
app.use('/api', (req, res, next) => connectDB().then(() => next(), next));
app.use('/api', apiRoutes);
app.use('/api', notFound);

// production: serve the built SPA and fall back to index.html for client-side routes
if (fs.existsSync(CLIENT_DIST)) {
  app.use(
    '/assets',
    express.static(path.join(CLIENT_DIST, 'assets'), { maxAge: '1y', immutable: true })
  );
  app.use(express.static(CLIENT_DIST, { index: false }));
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

// local / VPS: run as a server. On Vercel the exported app is the function handler.
if (require.main === module && !process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err.message);
      process.exit(1);
    });
}

module.exports = app;
