const campaignCtrl = require("../controller/campaign.controller");
const express = require("express");
const router = express.Router();
const auth = require("../config/auth");

router.post("/createCampaignMarketing", auth, campaignCtrl.createCampaignMarketing);
router.post("/createCampaignUtility", auth, campaignCtrl.createCampaignUtility);
router.post("/duplicateCampaign/:id", auth, campaignCtrl.duplicateCampaign);
router.post("/createRetargetCampaign", auth, campaignCtrl.createRetargetCampaign);
router.post("/sendMessage", auth, campaignCtrl.sendMessage);
router.post("/getAllCampaigns", auth, campaignCtrl.getAllCampaigns);
router.post("/getCampaignById", auth, campaignCtrl.getCampaignById);
router.delete("/deleteCampaign", auth, campaignCtrl.deleteCampaign);
router.post("/campaignAudienceCount", auth, campaignCtrl.campaignAudienceCount);

router.post("/getMessageLog", auth, campaignCtrl.getMessageLog);
router.post("/getMessagesForCampaign", auth, campaignCtrl.getMessagesForCampaign);
router.post("/removeDuplicateLogs", auth, campaignCtrl.removeDuplicateLogs);

module.exports = router;
