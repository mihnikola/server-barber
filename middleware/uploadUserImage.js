const multer = require('multer');

// Accept only image files: jpeg, jpg, png
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpeg, .jpg, and .png image formats are allowed'));
  }
};

// Multer config using memory storage (no disk writes)
const uploadUserImage = multer({
  storage: multer.memoryStorage(), // ✅ keep file in memory
  limits: { fileSize: 5 * 1024 * 1024 }, // ✅ 5MB max file size
  fileFilter, // ✅ validate file type
});

module.exports = uploadUserImage;
