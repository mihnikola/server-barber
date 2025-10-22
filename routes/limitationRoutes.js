const express = require("express");
const limitationsController = require("../controllers/limitationsController");

const router = express.Router();

router.get("/", limitationsController.getLimitations);
router.put("/:id", limitationsController.putLimitations);

module.exports = router;
