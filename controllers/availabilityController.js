const { default: axios } = require("axios");
const {
  updateTimeToTenUTC,
  convertToTimeStamp,
  convertToEndDateValue,
  canAddReservation,
} = require("../helpers");
const Availability = require("../models/Availability");
const Token = require("../models/Token");
const Rating = require("../models/Rating");
const jwt = require("jsonwebtoken");
const { getSortReservationData } = require("../helpers/getTimeZone");
const { LOCALIZATION_MAP } = require("../helpers/localizationMap");
const CountReservation = require("../models/CountReservation");

//promene validne
exports.getAvailabilities = async (req, res) => {
  const timeZone = req.headers["time-zone"];
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");

  const lang = req.headers["language"];
  const localization = LOCALIZATION_MAP[lang]?.SERVICES;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const customerId = decoded.id;

    const reservationData = await Availability.find({
      user: customerId,
      status: { $nin: [1] },
    })
      .sort({ date: 1 })
      .populate("service")
      .populate("place")
      .populate("employer");

    const reservations = getSortReservationData(reservationData, timeZone);

    const reservationFinalData = reservations.map((item) => {
      return {
        ...item,
        service: {
          ...item.service,
          name: localization[item.service.name] || item.service.name,
        },
      };
    });

    res.status(200).json(reservationFinalData);
  } catch (err) {
    console.log("errorcina", err);
    res.status(500).json({ error: err.message });
  }
};

function updateServiceName(reservationItem, localization) {
  if (reservationItem.service) {
    reservationItem.service.name = localization[reservationItem.service.name];
  }
  return reservationItem;
}

exports.getAvailability = async (req, res) => {
  const { id } = req.params;

  const lang = req.headers["language"];
  const localization = LOCALIZATION_MAP[lang]?.SERVICES;

  try {
    const reservationItem = await Availability.findOne({ _id: id })
      .populate("service")
      .populate("place")
      .populate("rating")
      .populate({
        path: "employer",
        populate: { path: "seniority" },
      });

    const filteredEmployers = [reservationItem.employer]; // <- sada je definisan
    const employerIds = [reservationItem.employer._id]; // koristi se u agregaciji

    const aggregatedData = await Availability.aggregate([
      {
        $match: {
          employer: { $in: employerIds },
        },
      },
      {
        $lookup: {
          from: "ratings",
          localField: "rating",
          foreignField: "_id",
          as: "ratingInfo",
        },
      },
      {
        $unwind: {
          path: "$ratingInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          ratingInfo: { $ne: null }, // <-- Ovo je dodatak
        },
      },
      {
        $group: {
          _id: "$employer",
          averageRating: { $avg: "$ratingInfo.rate" },
          userSet: { $addToSet: "$user" },
        },
      },
      {
        $project: {
          _id: 1,
          averageRating: 1,
          userCount: { $size: "$userSet" },
        },
      },
    ]);

    // 3. Napravi mapu za brz pristup statistikama po employerId
    const aggregationMap = {};
    aggregatedData.forEach((item) => {
      aggregationMap[item._id.toString()] = {
        averageRating: item.averageRating || 0,
        userCount: item.userCount || 0,
      };
    });

    // 4. Mapiraj finalni rezultat koji se šalje frontend-u
    const result = filteredEmployers.map((user) => {
      const stats = aggregationMap[user._id.toString()] || {};
      return {
        id: user._id,
        name: user.name,
        image: user.image,
        seniority: user?.seniority?.title || null,
        averageRating: stats.averageRating || 0,
        userCount: stats.averageRating !== 0 ? stats.userCount : 0,
      };
    });

    const updatedReservation = updateServiceName(reservationItem, localization);
    const updatedReservationItem = {
      ...updatedReservation.toObject(),
      employer: result[0],
      place: reservationItem.employer.place.address,
    };

    res.status(200).json(updatedReservationItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.patchAvailabilityById = async (req, res) => {
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");

  try {
    const { id } = req.params;
    const { status, rate, description } = req.body;

    let newRatingIdValue;

    if (!status) {
      const newRating = new Rating({
        rate,
        description,
      });

      await newRating.save();

      newRatingIdValue = newRating._id.toString();
    }
    const updateObject = !status ? { rating: newRatingIdValue } : { status: 1 };

    const reservation = await Availability.findByIdAndUpdate(id, updateObject, {
      new: true,
    });

    if (!reservation) {
      return res.status(404).send("Reservation not found");
    }
    if (!status) {
      return res
        .status(200)
        .json({ status: 200, message: "Reservation is rated successfully" });
    }
    const functionUrl =
      "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/deleteAppointment";
    const resultDelete = await axios
      .post(functionUrl, { reservationId: reservation._id.toString() })
      .then((resu) => {
        return true;
      })
      .catch((er) => {
        return false;
      });

    if (resultDelete) {
      return res.status(201).json({
        status: 201,
        message: "Reservation is cancelled successfully",
      });
    }

    return res
      .status(400)
      .send({ status: 400, message: "Reservation is not exist" });
  } catch (error) {
    console.log("alooooobject", error);
    res.status(500).send({ message: "Something went wrong" });
  }
};

exports.createAvailability = async (req, res) => {
  try {
    const {
      date,
      time,
      service,
      token,
      customer,
      employerId,
      description,
      location,
    } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const tokenExpo = await Token.findOne({ user: decoded.id });
    const { serviceId, serviceDuration } = service;
    const customerId = customer !== "" ? null : tokenExpo.user;
    const employer = employerId === "" ? decoded.id : employerId;

    const reservationData = await Availability.find({
      user: customerId,
      status: { $nin: [1] },
    });

    const counterData = await CountReservation.findOne();

    const timeStampValue = convertToTimeStamp(date?.dateString || date, time);
    const startDate = updateTimeToTenUTC(date?.dateString || date, time);
    const endDate = convertToEndDateValue(startDate, serviceDuration);

    const locationId = location?.length > 0 ? location[0].id : location.id;

    const newReservation = {
      startDate,
      endDate,
      rating: null,
      service: serviceId,
      employer,
      user: customerId,
      place: locationId,
      description,
      approved: 0,
      status: 0,
      type: 0,
    };
    const isValidResponse = canAddReservation(
      newReservation,
      reservationData,
      counterData
    );
    const { isValid, errorMessage, errorStatus } = isValidResponse;

    if (!isValid) {
      return res
        .status(202)
        .json({ status: errorStatus, message: errorMessage });
    }

    const newAvailability = new Availability({
      startDate,
      endDate,
      rating: null,
      service: serviceId,
      employer,
      user: customerId,
      description,
      approved: 0,
      status: 0,
      type: 0,
    });

    await newAvailability.save();

    const newAvailabilityIdValue = newAvailability._id;

    const taskData = {
      userId: decoded.id,
      status: "scheduled",
      performAt: timeStampValue,
      token: tokenExpo.token,
      reservationId: newAvailabilityIdValue,
    };

    const functionUrl =
      "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/addTaskToFirestore";

    await axios
      .post(functionUrl, { taskData })
      .then(() => {
        return res.status(201).json({ status: 201, data: newAvailability });
      })
      .catch((err) => {
        console.log("sendDataToFirebase", err);
        if (err.errno < 0) {
          return res.status(500).json({ error: "Something went wrong" });
        }
      });
  } catch (err) {
    console.log("errorcina", err);
    return res.status(500).json({ error: err.message });
  }
};
