const {
  betweenDateUnavailability,
  getAvailableTimes,
} = require("../helpers/timeControllerMethods");
const Availability = require("../models/Availability");
const Time = require("../models/Time");
const jwt = require("jsonwebtoken");

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
    const timesData = await Time.find().sort({ value: 1 });

    const result = {
      date: req.query.date,
      employer: {
        id: req.query["employer[id]"],
      },
      serviceDuration: parseInt(req.query["service[duration]"], 10),
    };

    const { date: selectedDate, serviceDuration, employer } = result;
    const emplId = employer ? employer.id : decoded.id;
    const rangeStart = new Date(selectedDate + "T00:00:00.000Z").toISOString();
    const rangeEnd = new Date(selectedDate + "T23:00:00.000Z").toISOString();

    //between days
    const dateValue = await betweenDateUnavailability(
      Availability,
      rangeStart,
      rangeEnd,
      emplId,
      selectedDate
    );
    if (dateValue) {
      return res.status(200).json([]);
    }
    //between hours
    const timesDataFee = await getAvailableTimes(
      Availability,
      emplId,
      rangeEnd,
      rangeStart,
      timesData,
      selectedDate,
      serviceDuration
    );
    if (timesDataFee.length > 0) {
      return res.status(200).json(timesDataFee);
    }

    return res.status(200).json(timesData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
