const {
  timeToParameters,
  addMinutesToTime,
  getTimeValues,
  convertWithChooseService,
} = require("../helpers");
const Reservation = require("../models/Reservation");
const Time = require("../models/Time");
const jwt = require("jsonwebtoken");

function filterFutureTimeSlots(timeSlots, currentTime, dateValue) {
  const now = new Date();

  const dateS = new Date(dateValue);

  if (dateS > now) {
    return timeSlots;
  }
  return timeSlots.filter((timeSlot) => {
    const [hours, minutes] = timeSlot.value.split(":").map(Number);
    const slotTime = new Date(currentTime);
    slotTime.setHours(hours);
    slotTime.setMinutes(minutes);
    slotTime.setSeconds(0);
    slotTime.setMilliseconds(0);
    return slotTime > currentTime;
  });
}

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
function convertToDateFormat(dateStr) {
  // Parse the input date string to a Date object
  return dateStr.split("T")[0]; // Replace 'Z' with '+00:00'
}

function getDateRange(dateString) {
  const start = new Date(dateString + "T00:00:00.000Z");
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

const convertToDataTime = (valueData) => {
 const queryString = valueData;
const result = {};

queryString.split('&').forEach(pair => {
  const [key, value] = pair.split('=');
  if (key === 'date') {
    result.date = decodeURIComponent(value);
  } else if (key === 'employer[id]') {
    result.employer = { id: decodeURIComponent(value) };
  } else if (key === 'service[duration]') {
    result.serviceDuration = decodeURIComponent(value);
  }
});

  return result;
};
exports.getTimes = async (req, res) => {
  const now = new Date();
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");

  try {
    const result = convertToDataTime(req._parsedOriginalUrl.query);
    const { date, service, employer } = result;

    let decoded = null;
    if (token) {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    }
    const emplId = decoded ? decoded.id : employer.id;
    const { start, end } = getDateRange(convertToDateFormat(date));
    const reservation = await Reservation.find({
      status: { $nin: [2] },
      user: emplId,
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
            ? reservationForTime.service.duration - 10
            : null,
        };
      });

      const time = result.map((item) => {
        return addMinutesToTime(item.hours, item.minutes, item.duration);
      });

      const reservationValueTimesData = reservation.map((item) => {
        return convertWithChooseService(item.time, service.duration - 10);
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
        const futureSlots = filterFutureTimeSlots(result, now);
        res.status(200).json(futureSlots);
      });
    } else {
      const times = await Time.find();
      const futureSlots = filterFutureTimeSlots(times, now, date);

      res.status(200).json(futureSlots);
    }
  } catch (err) {
    console.log("object", err);
    res.status(500).json({ error: err.message });
  }
};
