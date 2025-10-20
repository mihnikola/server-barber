const express = require("express");
const availabilityAdminController = require("../controllers/availabilityAdminController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// router.get("/", authenticate, availabilityAdminController.getAvailabilities);
router.get("/", availabilityAdminController.getAvailabilities);
router.get("/check", availabilityAdminController.checkDays);
router.get("/:id", authenticate, availabilityAdminController.getAvailability);
router.put("/:id", authenticate, availabilityAdminController.patchAvailability);
router.post("/", authenticate, availabilityAdminController.createAvailability);

module.exports = router;
