const { default: axios } = require("axios");
const Availability = require("../models/Availability");
const jwt = require("jsonwebtoken");
const Token = require("../models/Token");

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
        return res
          .status(404)
          .json({ message: "Reservation is not found" });
      });
  } catch (error) {
    res.status(500).send(error);
  }
};
exports.createAvailability = async (req, res) => {
  try {
    const { startDate, endDate, token, description } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const tokenExpo = await Token.findOne({ user: decoded.id });
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
    const newAvailabilityIdValue = newAvailability._id;



    // u mongodb azurirati sve rezervacije na status 1 kako bi se
    //  otkazale za datog employera u okviru datog vrem.perioda
    
    //u fb kreirati funkciju koja ce obrisati sve rezervacije 
  







    // const taskData = {
    //   userId: decoded.id,
    //   status: "scheduled",
    //   performAt: startDate,
    //   token: tokenExpo.token,
    //   reservationId: newAvailabilityIdValue,
    // };

    //    const functionUrl2 = "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/deleteAppointment";
    // await axios
    //   .post(functionUrl2, { reservationId: reservation._id.toString() })
    //   .then(() => {
    //     return res
    //       .status(200)
    //       .json({ message: "Reservation is cancelled successfully" });
    //   })
    //   .catch(() => {
    //     return res
    //       .status(404)
    //       .json({ message: "Reservation is not found" });
    //   });

    // const functionUrl =
    //   "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/addTaskToFirestore";

    // await axios
    //   .post(functionUrl, { taskData })
    //   .then(() => {
    //     return res.status(201).json({ status: 201, data: newAvailability });
    //   })
    //   .catch((err) => {
    //     console.log("sendDataToFirebase", err);
    //     if (err.errno < 0) {
    //       return res.status(500).json({ error: "Something went wrong" });
    //     }
    //   });
    res.status(201).json(newAvailability);
  } catch (err) {
    console.log("errorcina", err);
    res.status(500).json({ error: err.message });
  }
};
