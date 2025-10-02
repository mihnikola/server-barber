const EmployersServices = require("../models/EmployersServices");

exports.getEmployersServices = async (req, res) => {
  try {
    const getData = await EmployersServices.find();
    res.status(200).json(getData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createEmployersServices = async (req, res) => {
  try {
    const { employers, services } = req.body;
    const newData = new EmployersServices({
      employers,
      services,
    });
    await newData.save();
    res.status(201).json(newData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
