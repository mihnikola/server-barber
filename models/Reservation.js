const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    rate: {
      type: Object,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    customer: {
      type: String,
    },
    description: {
      type: String,
    },
    status: {
      type: Number,
    },
    approved: {
      type: Number,
    },
    //status .... default active reservation 0 or cancel reservation 2
    //approved ... default check reservation 1 or skip reservation 0
  },
  { timestamps: true }
);

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = Reservation;
