const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const MessageLogSchema = mongoose.Schema(
  {
    camId: { type: String, default: CONSTANT.NULL_STRING },
    mobileNumber: { type: String, default: CONSTANT.ZERO },
    waMessageId: { type: String, default: CONSTANT.NULL_STRING },
    status: { type: String, default: CONSTANT.NULL_STRING },
    reason: { type: String, default: CONSTANT.NULL_STRING },
    msgType: { type: String, default: CONSTANT.NULL_STRING },
    messageTitle: { type: String, default: CONSTANT.NULL_STRING },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("messageLog", MessageLogSchema);
