const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const ClientSchema = mongoose.Schema(
  {
    name: { type: String, default: CONSTANT.NULL_STRING },
    company_name: { type: String, default: CONSTANT.NULL_STRING },
    mobile_number: { type: String, default: CONSTANT.NULL_STRING },
    whatsapp_number: { type: String, default: CONSTANT.NULL_STRING },
    website: { type: String, default: CONSTANT.NULL_STRING },
    isNumberOnWhatsapp: { type: String, default: "yes" },
    invalidWhatsappNumber: { type: Boolean, default: false },
    invalidPhoneNumber: { type: Boolean, default: false },
    email: {
      type: String,
      default: CONSTANT.NULL_STRING,
      lowercase: true,
    },
    city: { type: String, default: CONSTANT.NULL_STRING },
    district: { type: String, default: CONSTANT.NULL_STRING },
    address: { type: String, default: CONSTANT.NULL_STRING },
    profile_picture: {},
    company_profile_picture: {},
    instagramID: { type: String, default: CONSTANT.NULL_STRING },
    facebookID: { type: String, default: CONSTANT.NULL_STRING },
    groupId: { type: String, default: CONSTANT.NULL_STRING },
    groupName: { type: String, default: CONSTANT.NULL_STRING },
    isFavorite: { type: String, default: CONSTANT.NO },
    addedBy: { type: String, ref: CONSTANT.NULL_STRING },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("clients", ClientSchema);
