function notFound(req, res) {
  res.status(404).json({ message: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 25 MB)' : err.message;
    return res.status(400).json({ message });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Already exists' });
  }
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
}

module.exports = { notFound, errorHandler };
