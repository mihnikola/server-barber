const express = require("express");
const serviceController = require("../controllers/serviceController");
const router = express.Router();
router.get("/client", serviceController.getServices);
module.exports = router;
