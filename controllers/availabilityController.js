const { default: axios } = require("axios");
const {
  updateTimeToTenUTC,
  convertToTimeStamp,
  convertToEndDateValue,
} = require("../helpers");
const Availability = require("../models/Availability");
const Token = require("../models/Token");
const Rating = require("../models/Rating");
const jwt = require("jsonwebtoken");

exports.getAvailabilities = async (req, res) => {
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const customerId = decoded.id;

    const reservations = await Availability.find({
      user: customerId,
      status: { $nin: [2] },
    })
      .sort({ date: 1 })
      .populate("service")
      .populate("employer");
    res.status(200).json(reservations);
  } catch (err) {
    console.log("errorcina", err);
    res.status(500).json({ error: err.message });
  }
};
exports.getAvailability = async (req, res) => {
  const { id } = req.params;

  try {
    const reservationItem = await Availability.findOne({ _id: id })
      .populate("service")
      .populate("employer");
    res.status(200).json(reservationItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.patchAvailabilityById = async (req, res) => {
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");

  try {
    const { id } = req.params;
    const { status, rate, description } = req.body;

    let newRatingIdValue;

    if (status === 0 || !status) {
      const newRating = new Rating({
        rate,
        description,
      });

      await newRating.save();

      newRatingIdValue = newRating._id.toString();
    }
    const updateObject =
      status === 0 || !status ? { rating: newRatingIdValue } : { status: 1 };

    const reservation = await Availability.findByIdAndUpdate(id, updateObject, {
      new: true,
    });

    if (!reservation) {
      return res.status(404).send("Reservation not found");
    }
    if (status === 0 || !status) {
      return res
        .status(200)
        .json({ message: "Reservation is rated successfully" });
    }
    const functionUrl =
      "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/deleteAppointment";
    await axios
      .post(functionUrl, { reservationId: reservation._id.toString() })
      .then(() => {
        return res
          .status(200)
          .json({ message: "Reservation is cancelled successfully" });
      })
      .catch(() => {
        return res.status(404).send({message: "Reservation is not exist"});
      });
  } catch (error) {
    res.status(500).send({message: "Something went wrong"});
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

    const functionUrl =
      "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/addTaskToFirestore";

    await axios
      .post(functionUrl, { taskData })
      .then(() => {
        return res.status(201).json({ status: 201, data: newAvailability });
      })
      .catch((err) => {
        console.log("sendDataToFirebase", err);
        if (err.errno < 0) {
          return res.status(500).json({ error: "Something went wrong" });
        }
      });
  } catch (err) {
    console.log("errorcina", err);
    return res.status(500).json({ error: err.message });
  }
};
