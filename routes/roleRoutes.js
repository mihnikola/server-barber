const express = require('express');
const roleController = require('../controllers/roleController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new service
// router.get('/',authenticate, roleController.getRoles);
router.get('/', roleController.getRoles);

module.exports = router;
