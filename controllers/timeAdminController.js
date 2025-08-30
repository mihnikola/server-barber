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

exports.patchTime = async (req, res) => {};

const analyzeTimeSlots = (timeSlotsArray) => {
  // Check if the array is valid and has at least two elements
  if (!Array.isArray(timeSlotsArray) || timeSlotsArray.length < 2) {
    console.error(
      "Invalid input. Please provide an array with at least two time slots."
    );
    return null;
  }

  // Get the first and last objects
  const firstSlot = timeSlotsArray[0];
  const lastSlot = timeSlotsArray[timeSlotsArray.length - 1];

  // Extract the time values from the first two objects
  const time1Value = firstSlot.value;
  const time2Value = timeSlotsArray[1].value;

  // Split the "HH:mm" strings and convert to numbers
  const [hours1, minutes1] = time1Value.split(":").map(Number);
  const [hours2, minutes2] = time2Value.split(":").map(Number);

  // Convert times to total minutes from midnight for easy calculation
  const totalMinutes1 = hours1 * 60 + minutes1;
  const totalMinutes2 = hours2 * 60 + minutes2;

  // Calculate the difference in minutes
  const minuteDifference = totalMinutes2 - totalMinutes1;

  // Return an object with all the requested information
  return {
    firstValue: firstSlot,
    lastValue: lastSlot,
    minuteDifference: minuteDifference,
  };
};

exports.getTimes = async (req, res) => {
  try {
    const timesValue = await Time.find();

    const result = analyzeTimeSlots(timesValue);

    if (!result) {
      return res.status(500).json({ error: "Cannot fetch times" });
    }

    const futureSlots = {
      startHour: result.firstValue.value,
      endHour: result.lastValue.value,
      minutes: result.minuteDifference,
    };
    res.status(200).json(futureSlots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//create work hours and time slots between
/** 
 * POST METHOD
 * {
    "startHour": 9,
    "minutes": 10,
    "endHour": 16
}
 */
exports.createTimeSlots = async (req, res) => {
  try {
    const { startHour, minutes, endHour } = req.body;

    if (!minutes || typeof minutes !== "number" || minutes <= 0) {
      return res.status(400).json({
        status: 400,
        message:
          "Invalid minutes value provided. Please provide a positive number.",
      });
    }

    const timeSlots = [];
    const startTime = new Date();
    startTime.setHours(startHour, 0, 0, 0); // Start from 09:00 ovde moze start hour da se ubaci

    const endTime = new Date();
    endTime.setHours(endHour, 0, 0, 0); // End at 22:00 ovde moze end hour da se ubaci

    let currentTime = startTime;

    while (currentTime <= endTime) {
      // Format the time as a string "HH:mm"
      const hours = String(currentTime.getHours()).padStart(2, "0");
      const mins = String(currentTime.getMinutes()).padStart(2, "0");
      const timeValue = `${hours}:${mins}`;

      timeSlots.push({ value: timeValue });

      // Add the specified number of minutes
      currentTime.setMinutes(currentTime.getMinutes() + minutes);
    }

    // Clear existing time slots before inserting new ones
    await Time.deleteMany({});

    const createdTimes = await Time.insertMany(timeSlots);

    res.status(201).json({
      status: 201,
      message: `Time slots created successfully with a ${minutes}-minute interval.`,
      times: createdTimes,
    });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
};
