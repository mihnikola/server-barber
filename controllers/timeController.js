const { getTimeZoneSameDay } = require("../helpers/getTimeZone");
const {
  betweenDateUnavailability,
  getAvailableTimes,
} = require("../helpers/timeControllerMethods");
const Availability = require("../models/Availability");
const Employers = require("../models/Employers");
const Time = require("../models/Time");
const jwt = require("jsonwebtoken");

exports.getTimes = async (req, res) => {
  const timeZone = req.headers["time-zone"];

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

    const getCurrentFreeTimes = getTimeZoneSameDay(
      selectedDate,
      timeZone,
      timesDataFee
    );
    return res.status(200).json(getCurrentFreeTimes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const betweenDateFirstUnavailability = async (
  rangeStart,
  rangeEnd,
  selectedDate,
  ids
) => {
  const reservationsUnavailability = await Availability.find({
    status: { $nin: [1] },
    type: 1,
    startDate: { $lt: rangeStart },
    endDate: { $gt: rangeEnd },
    employer: { $in: ids },
  });
  if (reservationsUnavailability.length > 0) {
    if (
      reservationsUnavailability[0].startDate.toISOString().split("T")[0] !==
        selectedDate ||
      reservationsUnavailability[0].endDate.toISOString().split("T")[0] !==
        selectedDate
    )
      return true;
  } else {
    return false;
  }
};

const getAvailableTimesForEmployers = async (
  employerIds,
  rangeStart,
  rangeEnd,
  timesData,
  criteriaDate,
  serviceDurationMinutes
) => {
  const reservations = await Availability.find({
    status: { $nin: [1] },
    employer: { $in: employerIds },
    startDate: { $lt: rangeEnd },
    endDate: { $gt: rangeStart },
  });
  const reservationsByEmployer = {};
  employerIds.forEach((id) => {
    reservationsByEmployer[id] = [];
  });

  reservations.forEach((res) => {
    const empId = res.employer.toString();
    if (!reservationsByEmployer[empId]) reservationsByEmployer[empId] = [];
    reservationsByEmployer[empId].push(res);
  });
  const result = [];

  for (const timeSlot of timesData) {
    const [hours, minutes] = timeSlot.value.split(":").map(Number);
    const serviceStartTime = new Date(criteriaDate);
    serviceStartTime.setUTCHours(hours, minutes, 0, 0);
    const serviceEndTime = new Date(serviceStartTime);
    serviceEndTime.setUTCMinutes(
      serviceStartTime.getUTCMinutes() + serviceDurationMinutes
    );

    const freeEmployers = employerIds
      .filter((empId) => {
        const empReservations = reservationsByEmployer[empId] || [];

        const isOverlapped = empReservations.some((reservation) => {
          const reservationStart = reservation.startDate;
          const reservationEnd = reservation.endDate;

          return (
            serviceStartTime < reservationEnd &&
            serviceEndTime > reservationStart
          );
        });

        return !isOverlapped;
      })
      .map((empId) => ({ employer: empId }));
    if (freeEmployers.length > 0) {
      result.push({
        times: timeSlot,
        employersData: freeEmployers,
      });
    }
  }

  return result;
};

exports.firstAvailable = async (req, res) => {
  const timeZone = req.headers["time-zone"];

  try {
    const timesData = await Time.find().sort({ value: 1 });

    const result = {
      date: req.query.date,
      serviceDuration: parseInt(req.query["service[duration]"], 10),
    };

    const { date: selectedDate, serviceDuration } = result;
    const rangeStart = new Date(selectedDate + "T00:00:00.000Z").toISOString();
    const rangeEnd = new Date(selectedDate + "T23:00:00.000Z").toISOString();

    const employerIds = await Employers.find({
      place: "68bebf3420a3a6f22c697435",
    });

    //between days
    const ids = employerIds.map((item) => item._id);

    const dateValue = await betweenDateFirstUnavailability(
      rangeStart,
      rangeEnd,
      selectedDate,
      ids
    );

    if (dateValue) {
      return res.status(200).json([]);
    }
    //between hours
    const timesDataFee = await getAvailableTimesForEmployers(
      ids,
      rangeStart,
      rangeEnd,
      timesData,
      selectedDate,
      serviceDuration
    );

    const getCurrentFreeTimes = getTimeZoneSameDay(
      selectedDate,
      timeZone,
      timesDataFee
    );
    console.log("dateValue++-+-+-+-+--+---+-+", getCurrentFreeTimes);

    return res.status(200).json(getCurrentFreeTimes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
