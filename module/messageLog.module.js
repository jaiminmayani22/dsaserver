const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const MessageLogSchema = mongoose.Schema(
  {
    camId: { type: String, default: CONSTANT.NULL_STRING },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'clients' },
    mobileNumber: { type: Number, default: CONSTANT.ZERO },
    waMessageId: { type: Number, default: CONSTANT.NULL_STRING },
    status: { type: String, default: CONSTANT.NULL_STRING },
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
