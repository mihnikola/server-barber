const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },
    destinationLat: {
      type: String,
      required: true,
    },
    destinationLon: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Place = mongoose.model("Place", placeSchema);

module.exports = Place;
