const { prettyUrlDataImage, convertToTimeStamp } = require("../helpers/utils");
const Reservation = require("../models/Reservation");
const Token = require("../models/Token");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const axios = require("axios");
const { convertSerbianDateTimeToUTCWithSplitJoin, convertSlashDateToSerbianFormat, formatAndConvertToSerbian, updateTimeToTenUTC } = require("../helpers");

require("dotenv").config();

if (!admin.apps.length) {
  const serviceAccount = require("../helpers/barber-demo-218de-firebase-adminsdk-fbsvc-0f43d447e4.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function sendTaskToBackend(task) {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/addTaskToFirestore";
  await axios
    .post(functionUrl, { taskData: task })
    .then((res) => {
      console.log("solve", res.data.message);
    })
    .catch((err) => {
      console.log("err", err);
    });
}




exports.createReservation = async (req, res) => {
  try {
    const { date, time, service_id, token, customer, employerId } =
      req.body.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const tokenExpo = await Token.findOne({ user: decoded.id });

    const customerName = customer !== "" ? customer : "";
    const customerId = customer !== "" ? null : decoded.id;
    const employerData = employerId === "" ? decoded.id : employerId;
    const status = customer !== "" ? 1 : 0;
    const timeStampValue = convertToTimeStamp(date?.dateString, time);
    const dateTimeStringValue = updateTimeToTenUTC(date?.dateString, time);

    const newReservation = new Reservation({
      date: dateTimeStringValue,
      time,
      service: service_id,
      employer: employerData,
      user: customerId,
      customer: customerName,
      status,
    });

    await newReservation.save();

    const taskData = {
      status: "scheduled",
      performAt: timeStampValue,
      token: tokenExpo.token,
    };

    sendTaskToBackend(taskData);
    res.status(201).json(newReservation);
  } catch (err) {
    console.log("errorcina", err);
    res.status(500).json({ error: err.message });
  }
};

function convertToISO8601(dateInput) {
  let date;

  // Helper function to parse dot-separated date strings into YYYY-MM-DD format
  function parseDotSeparatedDate(inputString) {
    // Regex for YYYY.MM.DD or YYYY.DD.MM
    let matchYYYY = inputString.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
    if (matchYYYY) {
      const year = matchYYYY[1];
      const part2 = parseInt(matchYYYY[2], 10); // Could be month or day
      const part3 = parseInt(matchYYYY[3], 10); // Could be day or month

      // Attempt to determine YYYY.MM.DD vs YYYY.DD.MM
      // If part2 looks like a month (<=12) and part3 looks like a day (<=31)
      if (part2 <= 12 && part3 <= 31) {
        // Prefer YYYY.MM.DD if unambiguous or standard
        return `${year}-${String(part2).padStart(2, '0')}-${String(part3).padStart(2, '0')}`;
      } else if (part3 <= 12 && part2 <= 31) {
        // If part3 looks like a month and part2 looks like a day (e.g., YYYY.DD.MM)
        return `${year}-${String(part3).padStart(2, '0')}-${String(part2).padStart(2, '0')}`;
      }
      // Fallback if ambiguous or invalid parts
      return null;
    }

    // Regex for MM.DD.YYYY or DD.MM.YYYY
    let matchMDYorDMY = inputString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (matchMDYorDMY) {
      const part1 = parseInt(matchMDYorDMY[1], 10); // Could be month or day
      const part2 = parseInt(matchMDYorDMY[2], 10); // Could be day or month
      const year = matchMDYorDMY[3];

      // Attempt to determine MM.DD.YYYY vs DD.MM.YYYY
      // If part1 looks like a month (<=12) and part2 looks like a day (<=31)
      if (part1 <= 12 && part2 <= 31) {
        // Prefer MM.DD.YYYY if unambiguous or standard
        return `${year}-${String(part1).padStart(2, '0')}-${String(part2).padStart(2, '0')}`;
      } else if (part2 <= 12 && part1 <= 31) {
        // If part2 looks like a month and part1 looks like a day (e.g., DD.MM.YYYY)
        return `${year}-${String(part2).padStart(2, '0')}-${String(part1).padStart(2, '0')}`;
      }
      // Fallback if ambiguous or invalid parts
      return null;
    }

    return null; // No dot-separated pattern matched
  }

  // 1. Handle if the input is already a Date object
  if (dateInput instanceof Date) {
    date = dateInput;
  }
  // 2. Handle if the input is a number (assumed to be a Unix timestamp in milliseconds)
  else if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  }
  // 3. Handle if the input is a string
  else if (typeof dateInput === 'string') {
    let parsedString = dateInput;

    // First, try to parse specific dot-separated formats
    if (dateInput.includes('.')) {
      const reformattedDate = parseDotSeparatedDate(dateInput);
      if (reformattedDate) {
        parsedString = reformattedDate;
      }
    }

    // Attempt to create a Date object from the (potentially reformatted) string.
    // The Date constructor is quite flexible and can parse many common formats.
    date = new Date(parsedString);
  }
  // 4. Handle unsupported input types
  else {
    console.warn("Unsupported input type for date conversion. Expected string, number, or Date object.", typeof dateInput);
    return null;
  }

  // 5. Validate the created Date object
  // If new Date() fails to parse, it results in an "Invalid Date" object,
  // for which getTime() returns NaN.
  if (isNaN(date.getTime())) {
    console.warn("Invalid date input provided. Could not parse:", dateInput);
    return null;
  }

  // 6. Convert the valid Date object to ISO 8601 string (UTC)
  return date.toISOString();
}
// Get all reservations
exports.getReservations = async (req, res) => {
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");

  const { date, check } = req.query;

  const currentDate = new Date(); // This will be a valid JavaScript Date object

  // const utcDateTime = convertSerbianDateTimeToUTCWithSplitJoin(
  //   convertSlashDateToSerbianFormat(currentDate.toLocaleDateString()),
  //   formatAndConvertToSerbian(currentDate.toLocaleTimeString()),
  // );

   const utcDateTime = convertToISO8601(currentDate.toLocaleString('en-GB'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const dateValue = date ? date : null;
    const emplId = date ? decoded.id : null;
    const customerId = date ? null : decoded.id;

    let reservations = [];

    console.log("utcDateTime",utcDateTime);
    if (!date) {

      reservations = await Reservation.find({
        user: customerId,
        status: { $nin: [2] },
        date:
          check === "true"
            ? { $gte: utcDateTime }
            : { $lte: utcDateTime },
      })
        .sort({ date: 1 })
        .populate("service")
        .populate("employer");

    } else {
      reservations = await Reservation.find({
        status: { $nin: [2] },
        date: dateValue,
        employer: emplId,
      })
        .populate("service") // Populate service data
        .populate("user"); // Populate employee data
    }

    res.status(200).json(reservations);
  } catch (err) {
    console.log("sta bi", err);
    res.status(500).json({ error: err.message });
  }
};

exports.patchReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { status: 2 },
      { new: true }
    );
    if (!reservation) {
      return res.status(404).send("Reservation not found");
    }
    res.status(200).json({ message: "Reservation is cancelled successfully" });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

exports.getReservationById = async (req, res) => {
  const { id } = req.params;

  try {
    const reservationItem = await Reservation.findOne({ _id: id })
      .populate({
        path: "service",
        select: "id name duration price image",
        transform: (doc) => {
          if (doc.image) {
            // Assuming the image field stores the relative path
            // doc.image = `http://10.58.158.121:5000/${doc.image}`; // Construct the full URL
            doc.image = prettyUrlDataImage(
              `${process.env.API_URL}/${doc.image}`
            );
          }
          return doc;
        },
      })
      .populate({
        path: "user",
        select: "id name image",
        transform: (doc) => {
          if (doc.image) {
            // Assuming the image field stores the relative path
            doc.image = prettyUrlDataImage(
              `${process.env.API_URL}/${doc.image}`
            );
          }
          return doc;
        },
      }); // Populate employee data;
    res.status(200).json(reservationItem);
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
};
