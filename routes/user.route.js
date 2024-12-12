const userCtrl = require("../controller/user.controller");
const express = require("express");
const router = express.Router();
const {
  userSignupValidators,
  userLoginValidators,
  userVerifyValidators,
  userForgotValidators,
  userForgotResetValidators,
  userResetValidators,
  createUserValidators,
} = require("../middleware/user.middleware");
const auth = require("../config/auth");
const multer = require("multer");

var storageProfile = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/profile_picture')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

var storageCompanyProfile = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/company_profile_picture')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

var uploadProfile = multer({ storage: storageProfile });
var uploadCompanyProfile = multer({ storage: storageCompanyProfile });

router.post("/signUp", userSignupValidators, userCtrl.signUp);
router.post("/loginUser", userLoginValidators, userCtrl.loginUser);
router.post("/verifyToken", auth, userCtrl.verifyToken);
router.post("/forgotPassword", userForgotValidators, userCtrl.forgotPassword);
router.post("/resetForgotPassword", userForgotResetValidators, userCtrl.resetForgotPassword);
router.post("/verification", userVerifyValidators, userCtrl.verifyEmail);
router.post("/resetPassword", auth, userCtrl.resetPassword);
router.post("/updateUser", auth, userCtrl.updateUser);

// CLIENT ROUTES
router.post("/createClient", auth, userCtrl.createClient);
router.post("/getAllClient", auth, userCtrl.getAllClient);
router.post("/getAllClientCount", auth, userCtrl.getAllClientCount);
router.get("/getClientById/:id", auth, userCtrl.getClientById);
router.put("/updateClientById/:id", auth, userCtrl.updateClientById);
router.post("/updateClientProfile", auth, userCtrl.updateClientProfile);
router.post("/updateClientCompanyProfile", auth, userCtrl.updateClientCompanyProfile);
router.post("/bulkProfilePictureUpload", auth, uploadProfile.array('profile_picture', 500), userCtrl.bulkProfilePictureUpload);
router.post("/bulkCompanyProfilePictureUpload", auth, uploadCompanyProfile.array('company_profile_picture', 500), userCtrl.bulkCompanyProfilePictureUpload);

router.delete("/deleteClientById/:id", auth, userCtrl.deleteClientById);
router.post("/deleteClients", auth, userCtrl.deleteClients);

//GROUP ROUTES
router.post("/createGroup", auth, userCtrl.createGroup);
router.put("/updateGroupById/:id", auth, userCtrl.updateGroupById);
router.post("/addContactsToGroup", auth, userCtrl.addContactsToGroup);
router.delete("/deleteGroupById/:id", auth, userCtrl.deleteGroupById);

router.get("/getGroupById/:id", auth, userCtrl.getGroupById);
router.post("/getAllGroups", auth, userCtrl.getAllGroups);
router.post("/getAllGroupsName", auth, userCtrl.getAllGroupsName);
router.post("/getMembersForGroup", auth, userCtrl.getMembersForGroup);

//TRASH ROUTES
router.post("/getAllDeletedClient", auth, userCtrl.getAllDeletedClient);
router.post("/hardDeleteClients", auth, userCtrl.hardDeleteClients);
router.post("/restoreClients", auth, userCtrl.restoreClients);

module.exports = router;
