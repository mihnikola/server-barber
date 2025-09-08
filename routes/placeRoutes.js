const express = require("express");
const placeController = require("../controllers/placeController");
const { authenticate } = require("../helpers");

const router = express.Router();

router.post("/", placeController.createPlace);
router.get("/", authenticate, placeController.getPlaces);
router.put("/:id", authenticate, placeController.putPlace);
router.delete("/:id", authenticate, placeController.deletePlace);

module.exports = router;