const express = require("express");
const companyAdminController = require("../controllers/companyAdminController");
const { authenticate } = require("../helpers");

const router = express.Router();

// Create a new availability
// router.post("/", authenticate, companyAdminController.createCompany);

// // Get all companies
// router.get("/", authenticate, companyAdminController.getCompanies);
// router.get("/:id", authenticate, companyAdminController.getCompany);
// router.put("/:id", authenticate, companyAdminController.patchCompany);

module.exports = router;
