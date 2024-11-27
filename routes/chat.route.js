const chatCtrl = require("../controller/chat.controller");
const express = require("express");
const router = express.Router();
const auth = require("../config/auth");

router.post("/receivedMessagesHistory", auth, chatCtrl.receivedMessagesHistory);

module.exports = router;
