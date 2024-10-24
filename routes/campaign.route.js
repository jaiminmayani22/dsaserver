const campaignCtrl = require("../controller/campaign.controller");
const express = require("express");
const router = express.Router();
const auth = require("../config/auth");

router.post("/createCampaignMarketing", auth, campaignCtrl.createCampaignMarketing);
router.post("/createCampaignUtility", auth, campaignCtrl.createCampaignUtility);
router.post("/sendMessage", auth, campaignCtrl.sendMessage);
router.post("/getAllCampaigns", auth, campaignCtrl.getAllCampaigns);
router.delete("/deleteCampaign", auth, campaignCtrl.deleteCampaign);
router.post("/campaignAudienceCount", auth, campaignCtrl.campaignAudienceCount);

module.exports = router;
