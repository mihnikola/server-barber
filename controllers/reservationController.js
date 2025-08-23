const { prettyUrlDataImage, convertToTimeStamp } = require("../helpers/utils");
const Reservation = require("../models/Reservation");
const Token = require("../models/Token");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const axios = require("axios");
const { updateTimeToTenUTC } = require("../helpers");

require("dotenv").config();

if (!admin.apps.length) {
  const serviceAccount = require("../helpers/barber-demo-218de-firebase-adminsdk-fbsvc-0f43d447e4.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
async function deleteAppointment(reservationId) {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/deleteAppointment";
  await axios
    .post(functionUrl, { reservationId })
    .then((res) => {
      console.log("solve", res.data.message);
    })
    .catch((err) => {
      console.log("err", err);
    });
}
async function sendTaskToBackend(taskData) {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/addTaskToFirestore";
  await axios
    .post(functionUrl, { taskData })
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
    const timeStampValue = convertToTimeStamp(date?.dateString || date, time);
    const dateTimeStringValue = updateTimeToTenUTC(
      date?.dateString || date,
      time
    );

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

    const reservationIdValue = newReservation._id;

    const taskData = {
      userId: decoded.id,
      status: "scheduled",
      performAt: timeStampValue,
      token: tokenExpo.token,
      reservationId: reservationIdValue,
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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const customerId = decoded.id;

    const now = new Date();

    // Get local date components
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");

    // Get local time components
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");

    // Construct the string
    const localISOString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000+00:00`;


    console.log("ISO 8601 String:", localISOString, decoded); // Output: 2025-08-23T14:43:56.000Z

    const futureReservations = await Reservation.find({
      user: customerId,
      date: { $gt: localISOString },
      status: { $nin: [2] },
    })
      .sort({ date: 1 })
      .populate("service")
      .populate("employer");

    const pastReservations = await Reservation.find({
      user: customerId,
      date: { $lt: localISOString },
      status: { $nin: [2] },
    })
      .sort({ date: -1 })
      .populate("service")
      .populate("employer");
    const modifiedPastReservations = pastReservations.map((reservation) => ({
      ...reservation,
      past: true,
    }));
    const reservations = [...futureReservations, ...modifiedPastReservations];

    console.log("futureReservations", futureReservations);
    console.log("modifiedPastReservations", modifiedPastReservations);
    console.log("pastReservations", pastReservations);

    console.log("reservations", reservations);

    res.status(200).json(reservations);
  } catch (err) {
    console.log("errorcina", err);
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
      deleteAppointment(reservation._id);
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
        path: "employer",
        select: "id name image",
        transform: (doc) => {
          if (doc.image) {
            // Assuming the image field stores the relative path
            doc.image = doc.image;
          }
          return doc;
        },
      });
    res.status(200).json(reservationItem);
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
};
