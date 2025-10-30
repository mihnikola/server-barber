const express = require('express');
const userController = require('../controllers/userController');
// const { uploadUserImage } = require('../middleware/uploadUserImage');
const uploadUserImage = require('../middleware/uploadUserImage');

const router = express.Router();

// Create a new service
router.post('/', userController.createUser);
router.post('/login', userController.loginUser);
router.post('/loginViaGoogle', userController.loginViaGoogle);
router.get('/email', userController.sendOTP);
router.get('/sendOTPviaLogin', userController.sendOTPviaLogin);
router.get('/otpcode', userController.verifyOtpCode);
router.get('/verifyEmail', userController.verifyEmail);
router.post('/loginVerify', userController.loginVerify);
router.post('/logout',userController.logout);
router.get('/', userController.getEmployers);
// router.put('/:id', uploadUserImage ,userController.patchUser)
router.put('/:id', uploadUserImage.single('image'), userController.patchUser);

router.get('/:id', userController.getUser);
router.put('/:id/changePassword', userController.changeUserPassword);
router.put('/:id/changeLanguage', userController.changeLanguage);
module.exports = router;
