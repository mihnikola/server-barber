const express = require('express');
const tokenController = require('../controllers/tokenController');

const router = express.Router();

router.post('/send', tokenController.sendNotification);
router.post('/saveToken',tokenController.saveToken);

module.exports = router;
