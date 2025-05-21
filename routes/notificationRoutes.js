const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../helpers');

const router = express.Router();

// Create a new service
router.get('/',authenticate, notificationController.getNotifications);
router.get('/:id',authenticate, notificationController.getNotification);
router.put('/',authenticate, notificationController.patchNotification);

module.exports = router;
