const {
  getFreeTimes,
  getFreeTimesUnavailability,
  reservationForSameDate,
} = require("../helpers");
const Availability = require("../models/Availability");
const Time = require("../models/Time");
const jwt = require("jsonwebtoken");

function isSlotAvailable(startTimeStr, serviceDuration, reservations, date) {
  const start = new Date(`${date}T${startTimeStr}:00.000Z`);
  const end = new Date(start.getTime() + serviceDuration * 60000);

  return !reservations.some((res) => {
    const resStart = new Date(res.startDate);
    const resEnd = new Date(res.endDate);
    return start < resEnd && end > resStart;
  });
}

function getAvailableStartTimes(
  timesData,
  reservations,
  serviceDuration,
  date
) {
  const available = [];

  for (const timeObj of timesData) {
    const time = timeObj.value;
    if (isSlotAvailable(time, serviceDuration, reservations, date)) {
      available.push(timeObj); // keep full object if needed
    }
  }

  return available;
}
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
    const start = new Date(selectedDate);
    const emplId = employer ? employer.id : decoded.id;
    const rangeStart = new Date(selectedDate + "T00:00:00.000Z").toISOString();
    const rangeEnd = new Date(selectedDate + "T23:00:00.000Z").toISOString();

    const reservationsData = await Availability.find({
      status: { $nin: [1] },
      employer: emplId,
      type: 0,
      startDate: { $gte: start },
    }).populate("service", "duration");


    const reservationsUnavailability = await Availability.find({
      status: { $nin: [1] },
      employer: emplId,
      type: 1,
      startDate: { $lt: rangeEnd },
      endDate: { $gt: rangeStart },
    });

    if (reservationsUnavailability.length > 0) {
      const reservationCheck = reservationForSameDate(
        reservationsUnavailability,
        rangeStart,
        rangeEnd
      );
      if (reservationCheck === 0) {
        return res.status(200).json([]);
      }

      const freeTimes = getFreeTimesUnavailability(
        timesData,
        reservationsUnavailability,
        serviceDuration,
        reservationCheck
      );

      console.log("nakon odsustva",freeTimes);
      
      const freeTimesData = getFreeTimes(
        freeTimes,
        reservationsData,
        selectedDate
      );
      return res.status(200).json(freeTimesData);
    }

    if (reservationsData.length > 0) {

      console.log("QWert",reservationsData);

      const freeTimes = getAvailableStartTimes(
        timesData,
        reservationsData,
        serviceDuration,
        selectedDate
      );


      return res.status(200).json(freeTimes);
    } else {
      return res.status(200).json(timesData);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
