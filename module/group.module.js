const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const GroupSchema = mongoose.Schema(
  {
    groupId: { type: String, default: CONSTANT.NULL_STRING },
    name: { type: String, default: CONSTANT.NULL_STRING },
    remarks: { type: String, default: CONSTANT.NULL_STRING },
    addedBy: { type: String, default: CONSTANT.NULL_STRING },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("groups", GroupSchema);
