const { put } = require("@vercel/blob");
const Initial = require("../models/Initial");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

exports.createInitialData = [
  (req, res, next) => {
    upload.fields([
      { name: "image", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ message: "File size should not exceed 2MB" });
        }
        return res.status(500).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const {
        title,
        text,
      } = req.body;

      const updateData = {};
      for (const key of [
        "image",
      ]) {
        if (
          req.files &&
          req.files[key] &&
          req.files[key][0] &&
          req.files[key][0].buffer
        ) {
          const file = req.files[key][0];
          const fileName = `${Date.now()}-${file.originalname}`;

          const blob = await put(fileName, file.buffer, {
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });

          updateData[key] = blob.url;
        }
      }

      const newInitial = new Initial({
          title,
          text,
          image: updateData.image
      });

      await newInitial.save();

      res.status(201).json(newInitial);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
];
