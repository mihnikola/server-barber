const {
  timeToParameters,
  addMinutesToTime,
  getTimeValues,
  convertWithChooseService,
  getDateRange,
  convertToDateFormat,
  filterFutureTimeSlots,
} = require("../helpers");
const Reservation = require("../models/Reservation");
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

  try {
    const dateFromQuery = req.query.date;
    const currentDateTimeStampValue = req.query.dateTimeStampValue;
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


    let decoded = null;
    if (token) {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    }
    const emplId = employer ? employer.id : decoded.id;
    const { start, end } = getDateRange(convertToDateFormat(date));

    const reservation = await Reservation.find({
      status: { $nin: [2] },
      employer: emplId,
      date: { $gte: start, $lt: end },
    }).populate("service", "duration"); // This will populate only the 'duration' field from the Service model

    if (reservation.length > 0) {
      const times = timeToParameters(reservation);
      const result = times.map(([hours, minutes]) => {
        const reservationForTime = reservation.find((res) => {
          const [resHours, resMinutes] = res.time.split(":").map(Number);
          return resHours === hours && resMinutes === minutes;
        });
        return {
          hours,
          minutes,
          duration: reservationForTime
            ? reservationForTime.service?.duration - 10
            : null,
        };
      });

      const time = result.map((item) => {
        return addMinutesToTime(item.hours, item.minutes, item.duration);
      });
      const reservationValueTimesData = reservation.map((item) => {
        return convertWithChooseService(item.time, serviceDuration - 10);
      });
      const timeRanges = reservationValueTimesData.map((item, index) => {
        const timeValue = time[index].split(":").map(Number);
        const resultTime = `${timeValue[0] < 10 ? "0" : ""}${timeValue[0]}:${
          timeValue[1]
        }`;
        return {
          start: item,
          // end: time[index], //mora 09:50 a ne 9:50
          end: resultTime,
        };
      });

      getTimeValues(timeRanges).then((result) => {
        const futureSlots = filterFutureTimeSlots(result, currentDateTimeStampValue, date);
        res.status(200).json(futureSlots);
      });
    } else {
      const times = await Time.find();
      const futureSlots = filterFutureTimeSlots(times,currentDateTimeStampValue,  date);
      res.status(200).json(futureSlots);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
