const express = require("express");
const companyController = require("../controllers/companyController");
const { authenticate } = require("../helpers");
const router = express.Router();
router.get("/", authenticate, companyController.getCompany);
module.exports = router;