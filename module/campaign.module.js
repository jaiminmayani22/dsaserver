const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const CampaignSchema = mongoose.Schema(
    {
        name: { type: String, default: CONSTANT.NULL_STRING },
        type: { type: String, default: CONSTANT.NULL_STRING },
        schedule: { type: String, default: CONSTANT.NULL_STRING },
        status: { type: String, default: CONSTANT.NULL_STRING },
        receiver: { type: String, default: CONSTANT.NULL_STRING },
        messages: { type: String, default: CONSTANT.NULL_STRING },
        audience: { type: String, default: CONSTANT.NULL_STRING },
        audienceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'client' }],
        groups: { type: String, default: CONSTANT.NULL_STRING },
        countAudience: { type: Number, default: 0 },
        caption: { type: String, default: CONSTANT.NULL_STRING },
        button: { type: String, default: CONSTANT.NULL_STRING },
        messageType: { type: String, default: CONSTANT.NULL_STRING },
        addedBy: { type: String, default: CONSTANT.NULL_STRING },
        document: {},
        documentType: { type: String, default: CONSTANT.NULL_STRING },
        selectedRefTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'templateReferenceFormat' },
        leftContent: {},
        middleContent: {},
        rightContent: {},
        overallHealth: { type: String, default: CONSTANT.NULL_STRING },
        phonenumberHealth: { type: String, default: CONSTANT.NULL_STRING },
        wabaHealth: { type: String, default: CONSTANT.NULL_STRING },
        businessHealth: { type: String, default: CONSTANT.NULL_STRING },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("campaign", CampaignSchema);
