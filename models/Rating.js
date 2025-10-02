const mongoose = require("mongoose");

const ratingsSchema = new mongoose.Schema(
  {
    rate: {
      type: Number,
    },
    description: {
      type: String,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employers",
    },
  },
  { timestamps: true }
);

const Rating = mongoose.model("Rating", ratingsSchema);

module.exports = Rating;
