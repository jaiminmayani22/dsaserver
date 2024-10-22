const mongoose = require("mongoose");
const CONSTANT = require("../common/constant");

const MessageScheduleSchema = mongoose.Schema(
  {
    messageTitle: { type: String, default: CONSTANT.NULL_STRING },
    messageText: { type: String, default: CONSTANT.NULL_STRING },
    attachment: {},
    clientId: { type: [mongoose.Schema.Types.ObjectId], ref: 'clients' },
    clientContactNo: { type: Number, default: CONSTANT.NULL_STRING },
    messageType: { type: String, default: CONSTANT.NULL_STRING },
    messageStatus: { type: String, default: CONSTANT.NULL_STRING },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    scheduleDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    scheduleTime: { type: String, default: CONSTANT.NULL_STRING },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("messageSchedule", MessageScheduleSchema);
