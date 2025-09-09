const Place = require("../models/Place");
exports.createPlace = async (req, res) => {
  try {
    const { address, destinationLat, destinationLon } = req.body;
    const newPlace = new Place({
      address,
      destinationLat,
      destinationLon,
    });
    await newPlace.save();
    res.status(201).json(newPlace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePlace = async (req, res) => {
  try {
    const id = req.params.id;
    await Place.findByIdAndDelete(id);
    res.status(200).json({ message: "Place deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

exports.putPlace = async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.body;
    const place = await Place.findByIdAndUpdate(id, { address }, { new: true });
    if (!place) {
      return res.status(404).send("Place not found");
    }
    res.status(200).json({ message: "Place updated successfully" });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};
