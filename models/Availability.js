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
    //status .... default active reservation 0 or cancel reservation 1
    //approved ... default check reservation 0 or skip reservation 1
    //type ... reservation 0 or cancellation 1
    //description.....desc of reservation or cancellation

    //if cancellation...service and user are null
    //if reservation.... everything is not empty


  },
  { timestamps: true }
);

const Availability = mongoose.model("Availability", availabilitySchema);

module.exports = Availability;
