const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const CONSTANT = require("../common/constant");

app.set("superSecret", process.env.superSecret);

module.exports = (req, res, next) => {
  var token = req.headers.authorization || req.body.authorization || req.query.authorization;

  if (token) {
    token = token.split(" ")[1];
    jwt.verify(token, app.get("superSecret"), function (err, decoded) {
      if (err) {
        return res
          .status(401)
          .json({ message: CONSTANT.MESSAGE.TOKEN_EXPIRED });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(400).send({
      message: CONSTANT.MESSAGE.AUTHENTICATION_TOKEN_FAIL,
    });
  }
};
