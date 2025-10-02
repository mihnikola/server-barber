const mongoose = require("mongoose");

const employersServicesSchema = new mongoose.Schema(
  {
    employers: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employers",
    },
    services: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
  },
  { timestamps: true }
);
const EmployersServices = mongoose.model("EmployersServices",employersServicesSchema);
module.exports = EmployersServices;
