const mongoose = require("mongoose");

const otpCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expireAt: {
    type: Date,
    required: true,
  },
});
otpCodeSchema.index({ expireAt: 1 }, { expireAfterSeconds: 10 });

const OtpCodeModel = mongoose.model("VerificationOtpCode", otpCodeSchema);
module.exports = OtpCodeModel;
