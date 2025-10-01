const mongoose = require("mongoose");

const countReservationSchema = new mongoose.Schema(
  {
    counterDaily: {
      type: Number,
      required: true,
    },
    counterWeekly: {
      type: Number,
      required: true,
    },
    counterMonthly: {
      type: Number,
      required: true,
    },
    counterYearly: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const CountReservation = mongoose.model(
  "CountReservation",
  countReservationSchema
);

module.exports = CountReservation;
