const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const VariableSchema = mongoose.Schema(
  {
    name: { type: String, default: CONSTANT.NULL_STRING },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("variables", VariableSchema);
