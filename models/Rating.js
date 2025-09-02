const mongoose = require("mongoose");

const ratingsSchema = new mongoose.Schema(
  {
    rate: {
      type: Number,
    },
    description: {
      description: String,
    },
  },
  { timestamps: true }
);

const Rating = mongoose.model("Rating", ratingsSchema);

module.exports = Rating;
