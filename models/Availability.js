const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    rating: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rating",
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employers",
    },
    description: {
      type: String,
    },
    type: {
      type: Number,
    },
    status: {
      type: Number,
    },
    approved: {
      type: Number,
    },
  },
  { timestamps: true }
);

const Availability = mongoose.model("Availability", availabilitySchema);

module.exports = Availability;
