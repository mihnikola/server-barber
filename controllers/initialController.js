const Initial = require("../models/Initial");
exports.getInitialData = async (req, res) => {
  try {
    const lang = req.headers["language"];

    const initialsData = await Initial.find({lang});
    res.status(200).json(initialsData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
