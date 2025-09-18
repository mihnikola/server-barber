const express = require("express");
const companyAdminController = require("../controllers/companyAdminController");

const router = express.Router();

router.post("/", companyAdminController.createCompany);

// // Get all companies
// router.get("/", authenticate, companyAdminController.getCompanies);
// router.get("/:id", authenticate, companyAdminController.getCompany);
// router.put("/:id", authenticate, companyAdminController.patchCompany);

module.exports = router;
