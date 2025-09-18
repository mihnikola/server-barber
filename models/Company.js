const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
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
    aboutUs: {
      type: Object,
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
    media: {
      type: Object,
    },
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
