const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const ReceivedMessageSchema = mongoose.Schema(
  {
    from: { type: String , default: CONSTANT.NULL_STRING },
    fromName: { type: String, default: CONSTANT.NULL_STRING },
    message: { type: String, default: CONSTANT.NULL_STRING },
    ticketNumber: { type: String, default: CONSTANT.NULL_STRING },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("received_messages", ReceivedMessageSchema);
