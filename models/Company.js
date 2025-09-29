const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    contact: {
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
