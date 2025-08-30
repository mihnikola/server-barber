const express = require("express");
const timeAdminController = require("../controllers/timeAdminController");
const { authenticate } = require("../helpers");

const router = express.Router();

// Create a new service
router.post("/", authenticate, timeAdminController.createTimeSlots);

// Get all services
router.get("/", authenticate, timeAdminController.getTimes);
router.put("/", timeAdminController.patchTime);

module.exports = router;
