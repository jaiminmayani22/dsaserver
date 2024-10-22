const msgScheduleCtrl = require("../controller/message_schedule.controller");
const campaignCtrl = require("../controller/campaign.controller");
const express = require("express");
const router = express.Router();
const auth = require("../config/auth");

router.post("/createCampaignMarketing", auth, campaignCtrl.createCampaignMarketing);
router.post("/createCampaignUtility", auth, campaignCtrl.createCampaignUtility);
router.post("/sendMessage", auth, campaignCtrl.sendMessage);
router.post("/getAllCampaigns", auth, campaignCtrl.getAllCampaigns);
router.post("/campaignAudienceCount", auth, campaignCtrl.campaignAudienceCount);

router.post("/messageScheduleMarketting", auth, msgScheduleCtrl.messageScheduleMarketting);
router.get("/sendInstantMessage", auth, msgScheduleCtrl.sendInstantMessage);
router.get("/receivedMessagesHistory", auth, msgScheduleCtrl.receivedMessagesHistory);
router.get("/getMessageLog", auth, msgScheduleCtrl.getMessageLog);

module.exports = router;
