const userCtrl = require("../controller/user.controller");
const express = require("express");
const router = express.Router();
const auth = require("../config/auth");
const multer = require("multer");
const upload = multer({ dest: "../public/clients_csv/",limits: { fileSize: 1024 * 1024 * 5 } });

router.post("/importClientFromCSV", upload.single("file"), auth, userCtrl.importClientFromCSV);
// router.get("/exportClientToCSV", auth, userCtrl.exportClientToCSV);
router.post("/exportClientToCSV", userCtrl.exportClientToCSV);

module.exports = router;
