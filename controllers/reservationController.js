const { prettyUrlDataImage, convertToTimeStamp } = require("../helpers/utils");
const Reservation = require("../models/Reservation");
const Token = require("../models/Token");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const axios = require("axios");
const { updateTimeToTenUTC, convertToISO8601 } = require("../helpers");

require("dotenv").config();

if (!admin.apps.length) {
  const serviceAccount = require("../helpers/barber-demo-218de-firebase-adminsdk-fbsvc-0f43d447e4.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
async function deleteAppointment(tokenExpo, dateTimeStamp) {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/deleteAppointment";
  await axios
    .post(functionUrl, { tokenExpo, dateTimeStamp })
    .then((res) => {
      console.log("solve", res.data.message);
    })
    .catch((err) => {
      console.log("err", err);
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
    const customerId = customer !== "" ? null : tokenExpo.user;
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
      rate: null,
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
  const utcDateTime = convertToISO8601(currentDate.toLocaleString("en-GB"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const dateValue = date ? date : null;
    const emplId = date ? decoded.id : null;
    const customerId = date ? null : decoded.id;
    let reservations = [];
    if (!date) {
      reservations = await Reservation.find({
        user: customerId,
        status: { $nin: [2] },
        date:
          check === "true"
            ? { $gte: utcDateTime + ".000+00:00" }
            : { $lte: utcDateTime + ".000+00:00" },
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
    res.status(500).json({ error: err.message });
  }
};

exports.patchReservationById = async (req, res) => {
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");

  try {
    const { id } = req.params;
    const { status, rate } = req.body;

    let reservation = null;
    if (status === 0) {
      reservation = await Reservation.findByIdAndUpdate(
        id,
        { rate },
        { new: true }
      );
    } else {
      reservation = await Reservation.findByIdAndUpdate(
        id,
        { status: 2 },
        { new: true }
      );
    }

    if (!reservation) {
      return res.status(404).send("Reservation not found");
    }
    if (status === 0) {
      res.status(200).json({ message: "Reservation is rated successfully" });
    } else {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const tokenExpo = await Token.findOne({ user: decoded.id });

      deleteAppointment(tokenExpo.token, reservation.date);

      res
        .status(200)
        .json({ message: "Reservation is cancelled successfully" });
    }
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
