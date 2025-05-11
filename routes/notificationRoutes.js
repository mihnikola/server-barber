const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../helpers');

const router = express.Router();

// Create a new service
router.get('/',authenticate, notificationController.getNotifications);
router.post('/',authenticate, notificationController.createNotification);
router.post('/push', notificationController.sendNotification);

module.exports = router;
