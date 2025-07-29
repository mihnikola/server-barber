const express = require('express');
const userController = require('../controllers/userController');
const { uploadUserImage } = require('../middleware/uploadUserImage');

const router = express.Router();

// Create a new service
router.post('/', userController.createUser);
router.post('/login', userController.loginUser);
router.get('/email', userController.sendOTP);
router.get('/otpcode', userController.verifyOtpCode);
router.get('/verifyEmail', userController.verifyEmail);
router.get('/', userController.getUsers);
router.put('/:id', uploadUserImage ,userController.patchUser)
router.get('/:id', userController.getUser);
router.put('/:id/changePassword', userController.patchUser);
module.exports = router;
