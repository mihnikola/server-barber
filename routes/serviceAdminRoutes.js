const express = require("express");
const serviceAdminController = require("../controllers/serviceAdminController");
const { authenticate } = require("../helpers");
const uploadUserImage = require('../middleware/uploadUserImage');

const router = express.Router();

// Create a new service
router.post("/", uploadUserImage.single('image'), serviceAdminController.createService);

// Get all services
router.get("/", authenticate, serviceAdminController.getServices);
router.get("/:id", authenticate, serviceAdminController.getService);
router.put("/:id", authenticate, serviceAdminController.putService);
router.delete("/:id", authenticate, serviceAdminController.deleteService);

module.exports = router;
