const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const TemplateSchema = mongoose.Schema(
  {
    template: {},
    name: { type: String, default: CONSTANT.NULL_STRING },
    height: { type: String, default: CONSTANT.NULL_STRING },
    width: { type: String, default: CONSTANT.NULL_STRING },
    isApproved: { type: String, default: CONSTANT.NO },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("template", TemplateSchema);
