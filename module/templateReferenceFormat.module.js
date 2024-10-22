const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const TemplateReferenceFormatSchema = mongoose.Schema(
  {
    templateFormat: {},
    name: { type: String, default: CONSTANT.NULL_STRING },
    height: { type: String, default: CONSTANT.NULL_STRING },
    width: { type: String, default: CONSTANT.NULL_STRING },
    layers: [],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("templateReferenceFormat", TemplateReferenceFormatSchema);
