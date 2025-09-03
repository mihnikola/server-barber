const express = require("express");
const availabilityAdminController = require("../controllers/availabilityAdminController");
const { authenticate } = require("../helpers");

const router = express.Router();

// Create a new availability
router.post("/", authenticate, availabilityAdminController.createAvailability);

// Get all availabilities
// router.get("/", authenticate, availabilityController.getAvailabilities);
// router.get("/:id", authenticate, availabilityController.getAvailability);
// router.put("/:id", authenticate, availabilityController.patchAvailability);

module.exports = router;
