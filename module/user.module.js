const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const UsersSchema = mongoose.Schema(
  {
    name: { type: String, default: CONSTANT.NULL_STRING },
    email: {
      type: String,
      default: CONSTANT.NULL_STRING,
      lowercase: true,
    },
    phoneNo: {type: Number, default: CONSTANT.ZERO},
    password: { type: String, default: CONSTANT.NULL_STRING },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("users", UsersSchema);
