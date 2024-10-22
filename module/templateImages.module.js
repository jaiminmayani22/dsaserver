const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const TemplateImagesSchema = mongoose.Schema(
  {
    templateImages: {},
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("templateImages", TemplateImagesSchema);
