const express = require('express');
const serviceController = require('../controllers/serviceController');
const { authenticate } = require('../helpers');

const router = express.Router();

// Create a new service
router.post('/', authenticate ,serviceController.createService);

// Get all services
router.get('/', authenticate, serviceController.getServices);
router.put('/:id', authenticate, serviceController.putService);
router.delete('/:id', authenticate, serviceController.deleteService);
router.get('/client',serviceController.getServices)

module.exports = router;
