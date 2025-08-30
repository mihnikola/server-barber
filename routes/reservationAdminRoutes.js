const express = require('express');
const reservationAdminController = require('../controllers/reservationAdminController');
const { authenticate } = require('../helpers');

const router = express.Router();

// Create a new reservation
// Get all reservations
router.get('/', authenticate, reservationAdminController.getReservations);



module.exports = router;
