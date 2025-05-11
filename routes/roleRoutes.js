const express = require('express');
const roleController = require('../controllers/roleController');
const { authenticate } = require('../helpers');

const router = express.Router();

// Create a new service
router.get('/',authenticate, roleController.getRoles);

module.exports = router;
