const chatCtrl = require("../controller/chat.controller");
const express = require("express");
const router = express.Router();
const auth = require("../config/auth");

router.post("/receivedMessagesHistory", auth, chatCtrl.receivedMessagesHistory);
router.post("/sendDirectMessage", auth, chatCtrl.sendDirectMessage);

module.exports = router;
