const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },
    mapLink: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Place = mongoose.model("Place", placeSchema);

module.exports = Place;
