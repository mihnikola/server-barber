const {
  updateTimeToTenUTC,
  convertToTimeStamp,
  convertToEndDateValue,
  sendTaskToBackend
} = require("../helpers");
const Availability = require("../models/Availability");
const Token = require("../models/Token");
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
    const { date, time, service, token, customer, employerId, description } =
      req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const tokenExpo = await Token.findOne({ user: decoded.id });
    const { serviceId, serviceDuration } = service;

    const customerId = customer !== "" ? null : tokenExpo.user;
    const employer = employerId === "" ? decoded.id : employerId;

    const timeStampValue = convertToTimeStamp(date?.dateString || date, time);
    const startDate = updateTimeToTenUTC(date?.dateString || date, time);
    const endDate = convertToEndDateValue(startDate, serviceDuration);

    const newAvailability = new Availability({
      startDate,
      endDate,
      rating: null,
      service: serviceId,
      employer,
      user: customerId,
      description,
      approved: 0,
      status: 0,
      type: 0,
    });

    await newAvailability.save();

    const newAvailabilityIdValue = newAvailability._id;

    const taskData = {
      userId: decoded.id,
      status: "scheduled",
      performAt: timeStampValue,
      token: tokenExpo.token,
      reservationId: newAvailabilityIdValue,
    };

    sendTaskToBackend(taskData);
    res.status(201).json(newAvailability);
  } catch (err) {
    console.log("errorcina", err);
    res.status(500).json({ error: err.message });
  }
};
