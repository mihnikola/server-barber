const express = require('express');
const usersAdminController = require('../controllers/usersAdminController');
// const { uploadUserImage } = require('../middleware/uploadUserImage');
// const uploadUserImage = require('../middleware/uploadUserImage');

const router = express.Router();

// Create a new service
// router.post('/', usersAdminController.createUser);
// router.post('/login', usersAdminController.loginUser);
// router.post('/logout',usersAdminController.logout);
router.get('/', usersAdminController.getClients);
router.get('/search', usersAdminController.findClient);
router.get('/:id', usersAdminController.getClient);

// router.put('/:id', uploadUserImage.single('image'), usersAdminController.patchUser);

// router.get('/:id', usersAdminController.getUser);
// router.put('/:id/changePassword', usersAdminController.changeUserPassword);
module.exports = router;
