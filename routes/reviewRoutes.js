const express = require("express");
const reviewsController = require("../controllers/reviewsController");
const router = express.Router();
router.post("/", reviewsController.createReview);
module.exports = router;