const mongoose = require("mongoose");

const aboutUsSchema = new mongoose.Schema(
  {
    lang: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    textTwo: {
      type: String,
      required: true,
    },
    textThree: {
      type: String,
      required: true,
    },
    workDays: {
      type: String,
    },
    workSaturday: {
      type: String,
    },
    holidays: {
      type: String,
    },
  },
  { timestamps: true }
);

const AboutUs = mongoose.model("AboutUs", aboutUsSchema);

module.exports = AboutUs;
