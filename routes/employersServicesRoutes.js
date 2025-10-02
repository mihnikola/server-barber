const express = require("express");
const empServiceController = require("../controllers/empServiceController");

const router = express.Router();

router.post("/", empServiceController.createEmployersServices);
router.get("/", empServiceController.getEmployersServices);

module.exports = router;
