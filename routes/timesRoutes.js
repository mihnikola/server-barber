const express = require('express');
const timeController = require('../controllers/timeController');
const { authenticate } = require('../helpers');

const router = express.Router();

// Create a new service
router.post('/', authenticate, timeController.createTime);

// Get all services
router.get('/', authenticate, timeController.getTimes);

module.exports = router;
