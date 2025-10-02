const Place = require("../models/Place");

exports.getPlaces = async (req, res) => {
  try {
    const places = await Place.find({active: 1});
    const placesData = places.map((item) => {
      return {
        id: item._id,
        address: item.address,
        mapLink: item.mapLink,
      };
    });

    res.status(200).json({status:200, data: placesData});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


