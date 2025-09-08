const { default: axios } = require("axios");
const Time = require("../models/Time");
const jwt = require("jsonwebtoken");
// Import Firestore Timestamp if you're working with Firebase SDK
require("dotenv").config();
const { Readable } = require("stream"); // This imports the Readable stream correctly

// Your base64-encoded image (for example, a PNG image)
function base64ToUriFunc(base64String) {
  // Convert the base64 string to a buffer
  const fileBuffer = Buffer.from(base64String, "base64");

  // Create a readable stream
  const stream = new Readable();

  // Push the buffer to the stream
  stream.push(fileBuffer);

  // End the stream
  stream.push(null);

  // Return the stream object
  return stream;
}
const sendTaskToBackend = async (taskData) => {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/addTaskToFirestore";
  await axios
    .post(functionUrl, { taskData })
    .then((res) => {
      return res;
    })
    .catch((err) => {
      return err;
    });
};
const convertToEndDateValue = (date, value) => {
  console.log("date, duration", date, value);
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + value);

  console.log("xxxxxxxxxxxxxx", d.toISOString());
  return d.toISOString();
};

const prettyUrlDataImage = (data) => {
  return data.replace("\\", "/");
};

const addMinutesToTime = (hours, minutes, minutesToAdd) => {
  // Create a Date object and set the time to the provided hours and minutes
  let time = new Date();
  time.setHours(hours, minutes, 0, 0); // Set to the given hour and minute (e.g., 15:40)
  // Add the minutes to the time
  time.setMinutes(time.getMinutes() + minutesToAdd);
  // Get the updated hours and minutes
  let newHours = time.getHours();
  let newMinutes = time.getMinutes();
  // Format the result to ensure proper 2-digit minute formatting
  return `${newHours}:${newMinutes < 10 ? "0" : ""}${newMinutes}`;
};

const timeToParameters = (timeStr) => {
  let items = [];
  timeStr.map((item) => {
    items.push(item.time.split(":").map(Number));
  });
  return items;
};

const getTimeValues = async (timeRanges) => {
  const result = await Time.find({
    $nor: timeRanges.map((range) => ({
      value: { $gte: range.start, $lte: range.end },
    })),
  });
  return result;
};
const convertWithChooseService = (timeString, serviceDuration) => {
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setMinutes(date.getMinutes() - serviceDuration);
  const newTime = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
  return newTime;
};

// Middleware to protect routes (auth middleware)
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("authenticate", err);
    res.status(400).send("Invalid token");
  }
};

const convertToTimeStamp = (dateStr, timeStr) => {
  // Parse the date string into a JavaScript Date object

  // Parse the date string into a JavaScript Date object
  const dateObj = new Date(dateStr);

  // Split the time string into hours and minutes
  const [hours, minutes] = timeStr.split(":");

  // Set the hours and minutes on the Date object
  dateObj.setUTCHours(hours); // Set UTC hours
  dateObj.setUTCMinutes(minutes); // Set UTC minutes

  // Convert the Date object into the ISO 8601 format string in UTC timezone
  return dateObj.toISOString();
};
const convertToDateFormat = (dateStr) => {
  // Parse the input date string to a Date object
  return dateStr.split("T")[0]; // Replace 'Z' with '+00:00'
};

const getDateRange = (dateString) => {
  const start = new Date(dateString + "T00:00:00.000Z");
  return { start };
};

const filterFutureTimeSlots = (timeSlots, currentTime, dateValue) => {
  const date1 = currentTime.split("T")[0];
  const date2 = dateValue.split("T")[0];

  if (new Date(date2) > new Date(date1)) {
    return timeSlots;
  }
  const timestamp = currentTime.split("T")[1];

  const dateTimeStamp = new Date(dateValue);
  const [hours, minutes] = timestamp.split(":").map(Number);

  return timeSlots.filter((timeSlot) => {
    const [slotHours, slotMinutes] = timeSlot.value.split(":").map(Number);

    dateTimeStamp.setHours(slotHours);
    dateTimeStamp.setMinutes(slotMinutes);
    dateTimeStamp.setSeconds(0);
    dateTimeStamp.setMilliseconds(0);

    if (
      dateTimeStamp.getHours() > hours ||
      (dateTimeStamp.getHours() === hours &&
        dateTimeStamp.getMinutes() > minutes)
    ) {
      return true;
    }
  });
};
const getReservationsForDate = (reservations, date) => {
  return reservations.filter((res) => {
    if (!res.startDate) return false;
    const resDate = new Date(res.startDate).toISOString().split("T")[0];
    return resDate === date;
  });
};
// Define a function to get the free time slots
const getFreeTimes = (allTimes, reservations, selectedDate) => {
  // First, we create an array of time slots that are unavailable based on the reservations
  const unavailableTimes = [];
  reservations.forEach((res) => {
    const start = new Date(res.startDate);
    const end = new Date(res.endDate);
    const duration = res.service.duration;

    // Iterate through the time slots to mark all affected slots as unavailable
    for (const time of allTimes) {
      const timeDate = new Date(`${selectedDate}T${time.value}:00.000Z`);
      const timeWithService = new Date(timeDate);
      timeWithService.setMinutes(timeWithService.getMinutes() + duration);

      // Check if the time slot falls within a reservation period
      if (
        (timeDate >= start && timeDate < end) ||
        (timeWithService > start && timeWithService <= end) ||
        (start >= timeDate && start < timeWithService)
      ) {
        unavailableTimes.push(time.value);
      }
    }
  });

  // Now, filter the original timesData to keep only the free slots
  const freeTimes = allTimes.filter(
    (time) => !unavailableTimes.includes(time.value)
  );

  return freeTimes;
};

const getRegularFreeTimes = (allTimes, reservations, selectedDate) => {
  // First, we create an array of time slots that are unavailable based on the reservations
  const unavailableTimes = [];
  reservations.forEach((res) => {
    const start = new Date(res.startDate);
    const end = new Date(res.endDate);
    const duration = res.service.duration;

    // Iterate through the time slots to mark all affected slots as unavailable
    for (const time of allTimes) {
      const timeDate = new Date(`${selectedDate}T${time.value}:00.000Z`);
      const timeWithService = new Date(timeDate);
      timeWithService.setMinutes(timeWithService.getMinutes() + duration);

      // Check if the time slot falls within a reservation period
      if (
        (timeDate >= start && timeDate < end) ||
        (timeWithService > start && timeWithService <= end) ||
        (start >= timeDate && end < timeWithService)
      ) {
        console.log("getRegularFreeTimes", time.value);
        unavailableTimes.push(time.value);
      }
    }
  });

  // Now, filter the original timesData to keep only the free slots
  const freeTimes = allTimes.filter(
    (time) => !unavailableTimes.includes(time.value)
  );

  return freeTimes;
};
const reservationForSameDate = (
  reservationsUnavailability,
  rangeStart,
  rangeEnd
) => {
  const selectedDateStart = rangeStart.split("T")[0];
  const selectedDateEnd = rangeEnd.split("T")[0];
  for (const item of reservationsUnavailability) {
    const startDateStr = new Date(item.startDate).toISOString().split("T")[0];
    const endDateStr = new Date(item.endDate).toISOString().split("T")[0];

    if (selectedDateStart === startDateStr) {
      return 1;
    }
    if (selectedDateEnd === endDateStr) {
      return 2;
    }
    return 0;
  }
};
const getFreeTimesUnavailability = (allTimes, reservationItem, duration) => {
  let timeValue = "";
  const durationNew = duration - 10;

  const timeOnly = reservationItem[0].startDate;
  const newDate = new Date(timeOnly.getTime() - durationNew * 60 * 1000);
  const timeOnlyValue = newDate.toISOString().split("T")[1];
  timeValue = timeOnlyValue.substring(0, 5);

  return allTimes.filter((item) => item.value >= timeValue);
};
function updateTimeToTenUTC(dateString, timeString) {
  const datePart = dateString.substring(0, 10);
  const desiredUTCTime = `${timeString}:00.000+00:00`;
  const newUTCDateString = `${datePart}T${desiredUTCTime}`;
  console.log("newUTCDateString", newUTCDateString);
  return newUTCDateString;
}

function convertToEndDate(dateString, timeString) {
  const datePart = dateString.substring(0, 10);
  const desiredUTCTime = `${timeString}:00.000+00:00`;
  const newUTCDateString = `${datePart}T${desiredUTCTime}`;
  return newUTCDateString;
}

function convertToISO8601(dateInput) {
  // Helper function to parse DD/MM/YYYY, HH:mm:ss format
  function parseSlashSeparatedDateTime(inputString) {
    const match = inputString.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4}), (\d{1,2}):(\d{1,2}):(\d{1,2})$/
    );
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10); // Month is 1-indexed in input
      const year = parseInt(match[3], 10);
      const hour = parseInt(match[4], 10);
      const minute = parseInt(match[5], 10);
      const second = parseInt(match[6], 10);

      // Validate date parts for basic sanity
      if (
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31 &&
        hour >= 0 &&
        hour <= 23 &&
        minute >= 0 &&
        minute <= 59 &&
        second >= 0 &&
        second <= 59
      ) {
        const monthValue = month.toString().length > 1 ? month : `0${month}`;
        const dayValue = day.toString().length > 1 ? day : `0${day}`;
        const minuteValue =
          minute.toString().length > 1 ? minute : `0${minute}`;
        const hourValue = hour.toString().length > 1 ? hour : `0${hour}`;
        const secondValue =
          second.toString().length > 1 ? second : `0${second}`;

        // Create a Date object. Month is 0-indexed in JavaScript Date constructor.

        return `${year}-${monthValue}-${dayValue}T${hourValue}:${minuteValue}:${secondValue}`;
      }
    }
    return null;
  }

  // Helper function to parse DD. MM. YYYY. HH:mm:ss format
  function parseDotSpaceSeparatedDateTime(inputString) {
    const match = inputString.match(
      /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.\s*(\d{1,2}):(\d{1,2}):(\d{1,2})$/
    );
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10); // Month is 1-indexed in input
      const year = parseInt(match[3], 10);
      const hour = parseInt(match[4], 10);
      const minute = parseInt(match[5], 10);
      const second = parseInt(match[6], 10);

      // Validate date parts for basic sanity
      if (
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31 &&
        hour >= 0 &&
        hour <= 23 &&
        minute >= 0 &&
        minute <= 59 &&
        second >= 0 &&
        second <= 59
      ) {
        const monthValue = month.toString().length > 1 ? month : `0${month}`;
        const dayValue = day.toString().length > 1 ? day : `0${day}`;
        const minuteValue =
          minute.toString().length > 1 ? minute : `0${minute}`;
        const hourValue = hour.toString().length > 1 ? hour : `0${hour}`;
        const secondValue =
          second.toString().length > 1 ? second : `0${second}`;

        // Create a Date object. Month is 0-indexed in JavaScript Date constructor.
        return `${year}-${monthValue}-${dayValue}T${hourValue}:${minuteValue}:${secondValue}`;
        // Create a Date object. Month is 0-indexed in JavaScript Date constructor.
      }
    }
    return null;
  }

  // 1. Handle if the input is already a Date object
  if (dateInput instanceof Date) {
    return dateInput;
  }
  // 2. Handle if the input is a number (assumed to be a Unix timestamp in milliseconds)
  else if (typeof dateInput === "number") {
    return new Date(dateInput);
  }
  // 3. Handle if the input is a string
  else if (typeof dateInput === "string") {
    // Try parsing specific formats in order of specificity/ambiguity
    // First, try the new DD. MM. YYYY. HH:mm:ss format
    const match = dateInput.match(
      /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.\s*(\d{1,2}):(\d{1,2}):(\d{1,2})$/
    );

    const match2 = dateInput.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4}), (\d{1,2}):(\d{1,2}):(\d{1,2})$/
    );

    if (match) {
      return parseDotSpaceSeparatedDateTime(dateInput);
    }
    if (match2) {
      return parseSlashSeparatedDateTime(dateInput);
    }
    return dateInput;

    // Attempt to create a Date object from the (potentially reformatted) string.
  }
  // 4. Handle unsupported input types
  else {
    console.warn(
      "Unsupported input type for date conversion. Expected string, number, or Date object.",
      typeof dateInput
    );
    return null;
  }
}

module.exports = {
  updateTimeToTenUTC,
  convertToDateFormat,
  convertToISO8601,
  getDateRange,
  getTimeValues,
  timeToParameters,
  addMinutesToTime,
  convertWithChooseService,
  authenticate,
  base64ToUriFunc,
  prettyUrlDataImage,
  convertToTimeStamp,
  filterFutureTimeSlots,
  getFreeTimes,
  convertToEndDateValue,
  sendTaskToBackend,
  getFreeTimesUnavailability,
  getReservationsForDate,
  reservationForSameDate,
  getRegularFreeTimes,
};
