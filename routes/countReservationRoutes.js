const express = require("express");
const counterReservationController = require("../controllers/counterReservationController");

const router = express.Router();

router.post("/", counterReservationController.createCountReservation);
router.get("/", counterReservationController.getCountReservation);
router.delete("/:id", counterReservationController.deleteCountReservation);
router.put("/:id", counterReservationController.putCountReservation);

module.exports = router;
