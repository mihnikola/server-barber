const { default: axios } = require("axios");
const Availability = require("../models/Availability");
const jwt = require("jsonwebtoken");

// Get all notifications
exports.getAvailabilities = async (req, res) => {
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");

  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const availabilitiesData = await Availability.find();

    res.status(200).json(availabilitiesData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get one availability
exports.getAvailability = async (req, res) => {
  const { id } = req.params;
  try {
    const availability = await Availability.findOne({ _id: id });
    res.status(200).json(availability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Patch all availabilities
exports.patchAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body.params;

    const availability = await Availability.findByIdAndUpdate(
      id,
      { isRead },
      { new: true }
    );
    if (!availability) {
      return res.status(404).send("Availability not found");
    }
    res.status(200).json({ message: "Availability is read" });
  } catch (error) {
    res.status(500).send(error);
  }
};
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
async function processUsers(reservationIds) {
  // Step 1: Create an array of promises
  const promises = reservationIds.map(async (id) => {
    // This function call returns a promise for each user
    const data = await deleteAppointment(id.toString());
    return data;
  });

  // Step 2: Wait for all promises to resolve
  // Promise.all() will wait for every promise in the array to complete
  const results = await Promise.all(promises);

  // This will now log the array of resolved data
  console.log(results);
  return results;
}
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

    // const reservationsUnavailability = await Availability.updateMany(
    //   {
    //     status: { $nin: [1] },
    //     employer: decoded.id,
    //     type: 0,
    //     startDate: { $gte: startDate, $lt: endDate },
    //   },
    //   {
    //     $set: { status: 1 },
    //   }
    // );

    const documentsToUpdate = await Availability.find({
      status: { $nin: [0] },
      // employer: decoded.id,68b4c4db4c8ee355cbf0ef6e
      employer: "68b4c4db4c8ee355cbf0ef6e",
      type: 0,
      startDate: { $gte: startDate, $lt: endDate },
    });

    // Extract the IDs of the documents
    const reservationIds = documentsToUpdate.map((doc) => doc._id);
    // Update the documents using the extracted IDs
    await Availability.updateMany(
      {
        _id: { $in: reservationIds },
      },
      {
        $set: { status: 1 },
      }
    );

    //1. poslati notifications firebase za otkazivanje rezervacija
    // 2. obrisati sve rezervacije firebase
    const resolution = await processUsers(reservationIds);

    console.log("first", resolution);

    // await deleteAppointment(rezervacijaId);
    // await functionCancelReservation(rezervacijaId){
    // obrisi sve redove u firebase
    //}

    res.status(201).json(resolution);
  } catch (err) {
    console.log("errorcina", err);
    res.status(500).json({ error: err.message });
  }
};
