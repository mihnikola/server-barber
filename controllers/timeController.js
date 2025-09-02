const {
  timeToParameters,
  addMinutesToTime,
  getTimeValues,
  convertWithChooseService,
  getDateRange,
  convertToDateFormat,
  filterFutureTimeSlots,
  getFreeTimes,
} = require("../helpers");
const Availability = require("../models/Availability");
const Time = require("../models/Time");
const jwt = require("jsonwebtoken");

exports.createTime = async (req, res) => {
  try {
    const { value } = req.body;
    const newTime = new Time({ value });
    await newTime.save();
    res.status(201).json(newTime);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTimes = async (req, res) => {
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");
  let decoded = null;

  if (token) {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  }

  try {
    const timesData = await Time.find();

    const dateFromQuery = req.query.date;
    const employerIdFromQuery = req.query["employer[id]"];
    const serviceDurationFromQuery = req.query["service[duration]"];

    const result = {
      date: dateFromQuery,
      employer: {
        id: employerIdFromQuery,
      },
      serviceDuration: parseInt(serviceDurationFromQuery, 10),
    };

    const { date, serviceDuration, employer } = result;

    const emplId = employer ? employer.id : decoded.id;

    const { start } = getDateRange(convertToDateFormat(date));

    const selectedDate = date;


    const reservationsUnavailability = await Availability.find({
      status: { $nin: [1] },
      employer: emplId,
      type: 1,
      startDate: { $lte: selectedDate },
      endDate: { $gte: selectedDate },
    });

    if (reservationsUnavailability.length > 0) {
      return res.status(200).json([]);
    }

    const reservationsData = await Availability.find({
      status: { $nin: [1] },
      employer: emplId,
      type: 0,
      startDate: { $gte: start },
    }).populate("service", "duration");

    if (reservationsData.length > 0) {
      const freeTimes = getFreeTimes(timesData, reservationsData, selectedDate);
      res.status(200).json(freeTimes);
    } else {
      res.status(200).json(timesData);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
