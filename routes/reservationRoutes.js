const express = require('express');
const reservationController = require('../controllers/reservationController');
const { authenticate } = require('../helpers');

const router = express.Router();

// Create a new reservation
router.post('/', authenticate, reservationController.createReservation);

// Get all reservations
router.get('/', authenticate, reservationController.getReservations);
router.get('/:id', authenticate, reservationController.getReservationById);
router.put('/:id', authenticate, reservationController.patchReservationById)


module.exports = router;
