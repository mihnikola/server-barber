const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    mapsLink: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
    },
    description: {
      type: String,
    },
    workHoursDescription: {
      type: String,
    },
    coverImages: {
      type: Object,
    },
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
