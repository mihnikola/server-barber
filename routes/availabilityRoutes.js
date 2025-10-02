const express = require("express");
const availabilityController = require("../controllers/availabilityController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new availability
// router.post("/", authenticate, availabilityController.createAvailability);
router.post("/", availabilityController.createAvailability);

// Get all availabilities
router.get("/", authenticate, availabilityController.getAvailabilities);
router.get("/:id",  availabilityController.getAvailability);
router.put("/:id", authenticate, availabilityController.patchAvailabilityById);

module.exports = router;
