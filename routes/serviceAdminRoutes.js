const express = require("express");
const serviceAdminController = require("../controllers/serviceAdminController");
const uploadUserImage = require('../middleware/uploadUserImage');
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new service
router.post("/", uploadUserImage.single('image'), serviceAdminController.createService);

// Get all services
router.get("/", authenticate, serviceAdminController.getServices);
router.get("/:id", authenticate, serviceAdminController.getService);
router.put("/:id", authenticate, serviceAdminController.putService);
router.delete("/:id", authenticate, serviceAdminController.deleteService);

module.exports = router;
