
const Availability = require("../models/Availability");
const jwt = require("jsonwebtoken");

// Get all notifications
exports.getAvailabilities = async (req, res) => {
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");

  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const availabilitiesData = await Availability.find();

    res.status(200).json(availabilitiesData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get one availability
exports.getAvailability = async (req, res) => {
  const { id } = req.params;
  try {
    const availability = await Availability.findOne({ _id: id });
    res.status(200).json(availability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Patch all availabilities
exports.patchAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body.params;

    const availability = await Availability.findByIdAndUpdate(
      id,
      { isRead },
      { new: true }
    );
    if (!availability) {
      return res.status(404).send("Availability not found");
    }
    res.status(200).json({ message: "Availability is read" });
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.createAvailability = async (req, res) => {
  try {
    const { startDate, endDate, token, description } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const newAvailability = new Availability({
      startDate,
      endDate,
      rating: null,
      service: null,
      user: null,
      employer: decoded.id,
      description,
      approved: 0,
      status: 0,
      type: 1,
    });

    await newAvailability.save();

    res.status(201).json(newAvailability);
  } catch (err) {
    console.log("errorcina", err);
    res.status(500).json({ error: err.message });
  }
};
