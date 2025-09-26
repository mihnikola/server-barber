const express = require("express");
const placeAdminController = require("../controllers/placeAdminController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", placeAdminController.createPlace);
router.get("/", authenticate, placeAdminController.getPlaces);
router.put("/:id", authenticate, placeAdminController.putPlace);
router.delete("/:id", authenticate, placeAdminController.deletePlace);

module.exports = router;