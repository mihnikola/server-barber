const express = require("express");
const aboutUsController = require("../controllers/aboutUsController");
const router = express.Router();
router.post("/", aboutUsController.createAbout);
module.exports = router;