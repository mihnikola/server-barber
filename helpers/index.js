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
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

function toLocaleDateTimeString(utcString) {
  const date = new Date(utcString);
  return date.toLocaleString();
}

const filterFutureTimeSlots = (timeSlots, currentTime, dateValue) => {
  const slotTimeLocale = new Date(currentTime);
  const slotTime = toLocaleDateTimeString(slotTimeLocale);

  const now = new Date();
  const dateS = new Date(dateValue);
  if (toLocaleDateTimeString(dateS) > toLocaleDateTimeString(now)) {
    return timeSlots;
  }

  return timeSlots.filter((timeSlot) => {
    const [hours, minutes] = timeSlot.value.split(":").map(Number);
    slotTimeLocale.setHours(hours);
    slotTimeLocale.setMinutes(minutes);
    slotTimeLocale.setSeconds(0);
    slotTimeLocale.setMilliseconds(0);

    return slotTimeLocale > currentTime;
  });
};

function updateTimeToTenUTC(dateString, timeString) {
  const datePart = dateString.substring(0, 10);
  const desiredUTCTime = `${timeString}:00.000+00:00`;
  const newUTCDateString = `${datePart}T${desiredUTCTime}`;
  return newUTCDateString;
}

function convertSlashDateToSerbianFormat(slashDate) {
  if (slashDate.includes("/")) {
    const parts = slashDate.split("/");
    if (parts.length === 3) {
      const month = parts[0].padStart(2, "0");
      const day = parts[1].padStart(2, "0");
      const year = parts[2];
      return `${day}.${month}.${year}`;
    } else {
      return "Invalid date format provided. Expected MM/DD/YYYY or similar.";
    }
  } else {
    const parts = slashDate.split(" ");
    const month = parts[0].split(".")[0];
    const day = parts[1].split(".")[0];
    const year = parts[2];
    return `${day}.${month}.${year}`;
  }
}

function convertSerbianDateTimeToUTCWithSplitJoin(dateString, timeString) {
  const localeDateTimeString = `${dateString} ${timeString}`;
  if (!localeDateTimeString) {
    return null;
  }

  console.log("localeDateTimeString", localeDateTimeString);

  // Split the localeDateTimeString
  const dateAndTimeParts = localeDateTimeString?.split(" "); // Split date and time
  let day = dateAndTimeParts[0]?.split(".")[0];
  let month = dateAndTimeParts[0]?.split(".")[1];
  let year = dateAndTimeParts[0]?.split(".")[2];

  let hour = dateAndTimeParts[1]?.split(":")[0];
  let minute = dateAndTimeParts[1]?.split(":")[1];
  let second = dateAndTimeParts[1]?.split(":")[2];

  // Parse day, month, year, hour, minute, and second directly
  day = parseInt(day, 10) - 1;
  month = parseInt(month, 10); // Month is 0-indexed
  year = parseInt(year, 10);
  hour = parseInt(hour, 10);
  minute = parseInt(minute, 10);
  second = parseInt(second, 10);

  //check if parsing was successful
  if (
    isNaN(day) ||
    isNaN(month) ||
    isNaN(year) ||
    isNaN(hour) ||
    isNaN(minute) ||
    isNaN(second)
  ) {
    console.error(`Invalid date/time value in: ${localeDateTimeString}`);
    return null;
  }
  const localDate = new Date(year, day, month, hour, minute, second);
  const utcDate = new Date(
    localDate.getTime() - localDate.getTimezoneOffset() * 60 * 1000
  );
  const utcTimeString = utcDate.toISOString();
  return utcTimeString;
}

function formatAndConvertToSerbian(dateTimeString) {
  const parts = dateTimeString.split(" ");
  const timePart = parts[0];
  const ampm = parts[1];

  let hour = parseInt(timePart.split(":")[0], 10);
  const minute = parseInt(timePart.split(":")[1], 10);
  let second = parseInt(timePart.split(":")[2], 10);

  // Convert AM/PM to 24-hour format
  if (ampm === "PM" && hour < 12) {
    hour += 12;
  } else if (ampm === "AM" && hour === 12) {
    hour = 0;
  }
  // Change the  seconds to 28
  second = 28;

  // Format the time string
  const formattedHour = String(hour).padStart(2, "0");
  const formattedMinute = String(minute).padStart(2, "0");
  const formattedSecond = String(second).padStart(2, "0");
  const formattedTime = `${formattedHour}:${formattedMinute}:${formattedSecond}`;

  return formattedTime;
}

module.exports = {
  updateTimeToTenUTC,
  convertSerbianDateTimeToUTCWithSplitJoin,
  formatAndConvertToSerbian,
  convertSlashDateToSerbianFormat,
  convertToDateFormat,
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
};
