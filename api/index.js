require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const config = require("config");
var static = require("serve-static");
const HOST_PORT = 8080;
const mongoose = require("mongoose");
const fs = require("fs");
const morgan = require("morgan");
const { log } = require("../config/logger.js");
const connectDB = require("../common/db.js");
let app = express();
const logFilePath = "app.log";
let root = require("../routes/index.js");
const CONSTANT = require("../common/constant.js");
const { isObjEmpty } = require("../common/common.js");
var eventsCronjob = require('../common/eventCron.js');

app.set("trust proxy", 1);
let corsOptions = {
  // origin: [ 
  //   "http://localhost:3000",
  //   "http://192.168.137.1:3000",
  //   "https://lavenderblush-turkey-116295.hostingersite.com"
  // ]
  origin: "*",
};

mongoose.promise = global.Promise;
connectDB();
app.set("views", path.join(__dirname, "../views"));
app.set("/logs", path.join(__dirname, "../logs"));
app.use(
  '/public',
  express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, path) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    },
  })
);
app.use('./public', express.static(path.join(__dirname, '../public')));
app.use(express.static("./document"));
app.use(express.static("../views"));
app.use("/document", express.static("./document"));
app.use("/document", express.static("document"));
app.set("view engine", "ejs");
app.set("superSecret", config.get("SUPERSECRET"));
app.use(express.json({ limit: "5mb" }));
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/public", express.static("public", {
  setHeaders: (res, path) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(helmet.referrerPolicy());

if (eventsCronjob) {
  eventsCronjob.shceduleCampaign();
}

app.use(
  morgan(function (tokens, req, res) {
    let _reqDesc = [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");
    log(config.get("STATUS").INFO, _reqDesc, {
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      message: res.statusMessage,
      request_params: JSON.stringify(
        (!isObjEmpty(req?.body) && req.body) ||
        ("" + !isObjEmpty(req?.params) && req?.params) ||
        ""
      ),
      "content-length": tokens.res(req, res, "content-length"),
      "response-time": tokens["response-time"](req, res) + "ms",
    });
    return _reqDesc;
  })
);

app.get("/", (req, res) => {
  res.send("application start");
});
app.use("/", root);

const dir = "./document";
const PORT = process.env.PORT || HOST_PORT;
app.listen(PORT, "0.0.0.0", () => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  }
  if (!fs.existsSync(CONSTANT.UPLOAD_DOC_PATH.PROFILE_PIC_PATH)) {
    fs.mkdirSync(CONSTANT.UPLOAD_DOC_PATH.PROFILE_PIC_PATH, {
      recursive: true,
    });
  }
  console.log(`Server is running on port ${PORT}.`);
});
