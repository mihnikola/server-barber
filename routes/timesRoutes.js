const express = require('express');
const timeController = require('../controllers/timeController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all services
// router.get('/', authenticate, timeController.getTimes);
router.get('/', timeController.getTimes);

module.exports = router;
