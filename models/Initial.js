const mongoose = require("mongoose");

const initialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

const Initial = mongoose.model("Initial", initialSchema);

module.exports = Initial;
