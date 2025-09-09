const express = require("express");
const placeController = require("../controllers/placeController");
const { authenticate } = require("../helpers");

const router = express.Router();

router.get("/", authenticate, placeController.getPlaces);


module.exports = router;