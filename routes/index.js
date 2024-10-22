const express = require("express");
const apiRouter = express.Router();
const CONSTANT = require("../common/constant");
const WEBHOOK_CONTROLLER = require("../controller/webhook.controller");
//Import Routing Files
let User = require("../routes/user.route.js");
let Template = require("../routes/template.route.js");
const messageSchedule = require("../routes/message_schedule.route");
const clientsImpExp = require("../routes/clientsImpExp.route");
const campaign = require("../routes/campaign.route");

// set routes with server
apiRouter.use("/user", User);
apiRouter.use("/template", Template);
apiRouter.use("/messageSchedule", messageSchedule);
apiRouter.use("/clientsImpExp", clientsImpExp);
apiRouter.use("/campaign", campaign);

//webhook
apiRouter.post("/webhook", WEBHOOK_CONTROLLER.webhookPost);
apiRouter.get("/webhook", WEBHOOK_CONTROLLER.webhookGet);

module.exports = apiRouter;
