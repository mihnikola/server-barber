const express = require("express");
const seniorityController = require("../controllers/seniorityController");
const router = express.Router();
router.post("/", seniorityController.createSeniority);
module.exports = router;