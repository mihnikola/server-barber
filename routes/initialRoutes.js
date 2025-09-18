const express = require("express");
const initialController = require("../controllers/initialController");
const router = express.Router();
router.get("/", initialController.getInitialData);
module.exports = router;