const express = require('express');
const timeController = require('../controllers/timeController');
const { authenticate } = require('../helpers');

const router = express.Router();

// Get all services
router.get('/', authenticate, timeController.getTimes);

module.exports = router;
