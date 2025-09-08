const mongoose = require("mongoose");

const employersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
    },
    image: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    token: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
    },
  },
  { timestamps: true }
);

const Employers = mongoose.model("Employers", employersSchema);

module.exports = Employers;
