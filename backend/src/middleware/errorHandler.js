const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880;
      const mb = Math.round((maxFileSize / (1024 * 1024)) * 10) / 10;
      return res.status(400).json({
        success: false,
        message: `Image must be ${mb}MB or smaller`,
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed',
    });
  }

  if (err.message === 'Only JPEG, PNG and WebP images are allowed') {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `${field} already exists` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
