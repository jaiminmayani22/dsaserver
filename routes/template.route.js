const templateCtrl = require("../controller/template.controller");
const express = require("express");
const router = express.Router();
const auth = require("../config/auth");

router.post("/createTemplate", auth, templateCtrl.createTemplate);
router.post("/getAllTemplates", auth, templateCtrl.getAllTemplates);
router.delete("/deleteTemplate/:id", auth, templateCtrl.deleteTemplate);

router.get("/sendInstantMessage", auth, templateCtrl.sendInstantMessage);
router.get("/receivedMessagesHistory", auth, templateCtrl.receivedMessagesHistory);
router.get("/getMessageLog", auth, templateCtrl.getMessageLog);

router.post("/templateImageUpload", auth, templateCtrl.templateImageUpload);
router.post("/templateFormatUpload", auth, templateCtrl.templateFormatUpload);
router.post("/templateReferenceFormatUpload", auth, templateCtrl.templateReferenceFormatUpload);
router.post("/getAllTemplateImages", auth, templateCtrl.getAllTemplateImages);
router.post("/getAllTemplateFormat", auth, templateCtrl.getAllTemplateFormat);
router.post("/getAllReferenceTemplateFormat", auth, templateCtrl.getAllReferenceTemplateFormat);
router.delete("/deleteRefTemplate/:_id", auth, templateCtrl.deleteRefTemplate);

router.post("/createVariable", templateCtrl.createVariable)
router.post("/getAllVariables", templateCtrl.getAllVariables)
router.post("/getVariableById/:id", templateCtrl.getVariableById)
router.delete("/deleteVariableById", templateCtrl.deleteVariableById)
router.post("/updateVariableById/:id", templateCtrl.updateVariableById)

module.exports = router;
