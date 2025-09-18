const express = require("express");
const initialAdminController = require("../controllers/initialAdminController");

const router = express.Router();

router.post("/", initialAdminController.createInitialData);
module.exports = router;
