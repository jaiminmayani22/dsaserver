const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const ReceivedMessageSchema = mongoose.Schema(
  {
    from: { type: Number , default: CONSTANT.ZERO },
    fromName: { type: String, default: CONSTANT.NULL_STRING },
    message: { type: String, default: CONSTANT.NULL_STRING },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("received_messages", ReceivedMessageSchema);
