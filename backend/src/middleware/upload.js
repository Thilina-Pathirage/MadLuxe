const multer = require('multer');
const path = require('path');

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only JPEG, PNG and WebP images are allowed'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
});

module.exports = upload;
