const msgScheduleCtrl = require("../controller/message_schedule.controller");
const express = require("express");
const router = express.Router();
const auth = require("../config/auth");

router.post("/messageScheduleMarketting", auth, msgScheduleCtrl.messageScheduleMarketting);
router.get("/sendInstantMessage", auth, msgScheduleCtrl.sendInstantMessage);
router.get("/receivedMessagesHistory", auth, msgScheduleCtrl.receivedMessagesHistory);
router.get("/getMessageLog", auth, msgScheduleCtrl.getMessageLog);

module.exports = router;
