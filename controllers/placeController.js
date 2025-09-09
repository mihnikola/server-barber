const Place = require("../models/Place");

exports.getPlaces = async (req, res) => {
  try {
    const places = await Place.find();
    const placesData = places.map((item) => {
      return {
        id: item._id,
        address: item.address,
        destinationLat: item.destinationLat,
        destinationLon: item.destinationLon,
      };
    });

    res.status(200).json(placesData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
