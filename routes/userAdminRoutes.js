const express = require("express");
const usersAdminController = require("../controllers/usersAdminController");
const uploadUserImage = require("../middleware/uploadUserImage");

const router = express.Router();

// Create a new service
router.post("/", usersAdminController.createEmployer);
router.post("/login", usersAdminController.loginEmployer);
router.post("/logout", usersAdminController.logoutEmployer);
router.get("/", usersAdminController.getClients);
router.get("/search", usersAdminController.findClient);
router.get("/:id", usersAdminController.getClient);
router.delete("/:id", usersAdminController.softDeleteUser);
router.put(
  "/:id",
  uploadUserImage.single("image"),
  usersAdminController.patchEmployer
);

router.get("/:id", usersAdminController.getEmployer);
router.put('/:id/changePassword', usersAdminController.changeEmployerPassword);
module.exports = router;
