const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const TemplateFormatSchema = mongoose.Schema(
  {
    templateFormat: {},
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("templateFormat", TemplateFormatSchema);
