const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// Create a new service
router.post('/', userController.createUser);
// router.post('/admin', userController.createAdminUser);
router.post('/login', userController.loginUser);
// router.post('/login/admin', userController.loginAdminUser);
router.get('/', userController.getUsers);
// router.get('/:id', userController.getUser);
// router.put('/:id', userController.patchUser);
module.exports = router;
