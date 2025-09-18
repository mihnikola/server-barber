const { put } = require("@vercel/blob");
const Company = require("../models/Company");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

exports.createCompany = [
  (req, res, next) => {
    upload.fields([
      { name: "coverImageHome", maxCount: 1 },
      { name: "coverImageAppointments", maxCount: 1 },
      { name: "coverImageBarber", maxCount: 1 },
      { name: "coverImageSettings", maxCount: 1 },
      { name: "coverImageReview", maxCount: 1 },
      { name: "logo", maxCount: 1 },
      { name: "icon", maxCount: 1 },
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
        name,
        mapsLink,
        contact,
        title,
        text,
        textTwo,
        textThree,
        workDays,
        workSaturday,
        holidays,
      } = req.body;

      const updateData = {};
      for (const key of [
        "coverImageHome",
        "coverImageAppointments",
        "coverImageBarber",
        "coverImageSettings",
        "coverImageReview",
        "logo",
        "icon",
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

      const newCompany = new Company({
        name,
        mapsLink,
        contact,
        aboutUs: {
          title,
          text,
          textTwo,
          textThree,
        },
        workDays,
        workSaturday,
        holidays,
        media: {
          coverImageHome: updateData.coverImageHome,
          coverImageAppointments: updateData.coverImageAppointments,
          coverImageBarber: updateData.coverImageBarber,
          coverImageSettings: updateData.coverImageSettings,
          coverImageReview: updateData.coverImageReview,
          logo: updateData.logo,
          icon: updateData.icon,
        },
      });

      await newCompany.save();

      res.status(201).json(newCompany);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
];
