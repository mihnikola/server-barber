const Company = require("../models/Company");

exports.getCompany = async (req, res) => {
  try {
    const companies = await Company.findOne();
    res.status(200).json(companies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
