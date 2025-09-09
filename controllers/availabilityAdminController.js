const { default: axios } = require("axios");
const Availability = require("../models/Availability");
const jwt = require("jsonwebtoken");

async function sendNotificationRequest(reservationData) {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/sendNotificationRequest";
  await axios
    .post(functionUrl, { reservationIds: reservationData })
    .then((res) => {
      console.log("sendNotification resoluve", res.data.message);
    })
    .catch((err) => {
      console.log("sendNotification error", err);
    });
}
async function deleteAppointmentsRequest(reservationData) {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/deleteAppointmentsRequest";
  await axios
    .post(functionUrl, { reservationIds: reservationData })
    .then((res) => {
      console.log("deleteAppointmentsRequest resoluve", res.data.message);
    })
    .catch((err) => {
      console.log("deleteAppointmentsRequest error", err);
    });
}

exports.getAvailabilities = async (req, res) => {
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");

  try {
    const { dateValue } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const rangeStart = new Date(dateValue + "T00:00:00.000Z").toISOString();
    const rangeEnd = new Date(dateValue + "T23:00:00.000Z").toISOString();

    const availabilitiesData = await Availability.find({
      employer: decoded.id,
      startDate: { $gt: rangeStart },
      endDate: { $lt: rangeEnd },
      status: { $nin: [1] },
    })
      .sort({ date: 1 })
      .populate("service")
      .populate("user");

    res.status(200).json(availabilitiesData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getAvailability = async (req, res) => {
  const { id } = req.params;
  try {
    const availabilityItem = await Availability.findOne({ _id: id })
      .populate("service")
      .populate("user");

    res.status(200).json(availabilityItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.patchAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await Availability.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).send("Reservation is not found");
    }

    const functionUrl =
      "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/deleteAppointment";
    await axios
      .post(functionUrl, { reservationId: reservation._id.toString() })
      .then(() => {
        return res
          .status(200)
          .json({ message: "Reservation is cancelled successfully" });
      })
      .catch(() => {
        return res.status(404).json({ message: "Reservation is not found" });
      });
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.createAvailability = async (req, res) => {
  try {
    const { startDate, endDate, token, description } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const newAvailability = new Availability({
      startDate,
      endDate,
      rating: null,
      service: null,
      user: null,
      employer: decoded.id,
      description,
      approved: 0,
      status: 0,
      type: 1,
    });
    await newAvailability.save();

    const reservationsDataDisabled = await Availability.find({
      status: { $nin: [1] },
      employer: decoded.id,
      type: 0,
      startDate: { $gte: startDate, $lt: endDate },
    });
    const reservationIdsDisabled = reservationsDataDisabled.map((doc) => doc._id.toString());

    await Availability.updateMany(
      {
        _id: { $in: reservationIdsDisabled },
      },
      {
        $set: { status: 1 },
      }
    );

    //1. poslati notifications firebase za otkazivanje rezervacija
    await sendNotificationRequest(reservationIdsDisabled);

    // 2. obrisati sve rezervacije firebase
    await deleteAppointmentsRequest(reservationIdsDisabled);

    res.status(201).json({ status: 201, message: "Uspeno kreirano odsustvo" });
  } catch (err) {
    console.log("errorcina", err);
    res.status(500).json({ error: err.message });
  }
};