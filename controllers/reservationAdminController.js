const Reservation = require("../models/Reservation");
const Token = require("../models/Token");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");

require("dotenv").config();

if (!admin.apps.length) {
  const serviceAccount = require("../helpers/barber-demo-218de-firebase-adminsdk-fbsvc-0f43d447e4.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Get all reservations by admin
exports.getReservations = async (req, res) => {
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");

  try {
    const { dateReservation } = req.body;
    // const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // const employerId = decoded.id;
    const employerId = '67b334b741e9f46cb841f03a';

    const reservations = await Reservation.find({
      employer: employerId,
      date: {$gte :dateReservation},
      status: { $nin: [2] },
    })
      .sort({ date: 1 })
      .populate("service")
      .populate("user");

    res.status(200).json(reservations);
  } catch (err) {
    console.log("errorcina", err);
    res.status(500).json({ error: err.message });
  }
};
