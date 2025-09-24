const mongoose = require("mongoose");

const reviewsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    lang: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewsSchema);

module.exports = Review;
