const Seniority = require("../models/Seniority");

exports.createSeniority = async (req, res) => {
  const { title, description } = req.body;

  try {
    const seniorityData = new Seniority({
      title,
      description,
    });
    await seniorityData.save();
    res.status(200).json(seniorityData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
