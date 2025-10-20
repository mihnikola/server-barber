const { default: axios } = require("axios");
const Availability = require("../models/Availability");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const { LOCALIZATION_MAP } = require("../helpers/localizationMap");

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
exports.checkDays = async (req, res) => {
  try {
    const monthValue = req.query["monthValue"];
    const date = new Date(monthValue);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    const result = await Availability.aggregate([
      {
        $match: {
          startDate: { $gte: start, $lt: end },
          employer: new mongoose.Types.ObjectId("67b325188505dffa6070ccbd"),
          status: { $nin: [1] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$startDate" },
            month: { $month: "$startDate" },
            day: { $dayOfMonth: "$startDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]);
    res.status(200).json(result);
  } catch (err) {
    console.log("err", err);
    res.status(500).json({ error: err.message });
  }
};

function convertReservationsToEvents(reservations) {
  const localization = LOCALIZATION_MAP["en"]?.SERVICES;

  return reservations.map((reservation) => {
    const startTime = new Date(reservation.startDate);
    const endTime = new Date(reservation.endDate);
    const formattedTime = startTime.toISOString().slice(11, 16);
    const formattedEndTime = endTime.toISOString().slice(11, 16);
    const statusMap = {
      0: "arrived",
      1: "missed",
    };
    return {
      id: reservation._id,
      name: localization[reservation.service?.name] || "undefined service",
      startTime: formattedTime,
      endTime: formattedEndTime,
      status: statusMap[reservation.approved] || "undefined",
      reservation: {
        id: reservation._id,
        note: reservation.description || "",
        user: reservation.user?.name || "undefined user",
      },
    };
  });
}

exports.getAvailabilities = async (req, res) => {
  // const token = req.header("Authorization")
  //   ? req.header("Authorization").split(" ")[1]
  //   : req.body.headers.Authorization
  //   ? req.body.headers.Authorization
  //   : req.get("authorization");
  // if (!token) return res.status(403).send("Access denied");

  try {
    const dateValue = req.query["dateValue"];
    // const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("getAvailabilities", dateValue);
    const rangeStart = new Date(dateValue + "T00:00:00.000Z").toISOString();
    const rangeEnd = new Date(dateValue + "T23:00:00.000Z").toISOString();

    const availabilitiesData = await Availability.find({
      employer: new mongoose.Types.ObjectId("67b325188505dffa6070ccbd"),
      startDate: { $gte: rangeStart, $lt: rangeEnd },
      status: { $nin: [1] },
    })
      .sort({ date: 1 })
      .populate("service")
      .populate("user");

    console.log("|availabilitiesData", availabilitiesData);

    const events = convertReservationsToEvents(availabilitiesData);

    res.status(200).json(events);
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
    const reservationIdsDisabled = reservationsDataDisabled.map((doc) =>
      doc._id.toString()
    );

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

    res.status(201).json({ status: 201, message: "Uspešno kreirano odsustvo" });
  } catch (err) {
    console.log("errorcina", err);
    res.status(500).json({ error: err.message });
  }
};
