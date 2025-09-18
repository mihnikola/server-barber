const Initial = require("../models/Initial");
exports.getInitialData = async (req, res) => {
  try {
    const initialsData = await Initial.find();
    res.status(200).json(initialsData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
