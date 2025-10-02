const mongoose = require("mongoose");

const senioritySchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

const Seniority = mongoose.model("Seniority", senioritySchema);

module.exports = Seniority;
