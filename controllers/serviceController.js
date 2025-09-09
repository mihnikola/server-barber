const Service = require("../models/Service");

exports.getServices = async (req, res) => {
  try {
    const services = await Service.find();

    const servicesData = services.map((item) => {
      return {
        id: item._id,
        name: item.name,
        price: item.price,
        duration: item.duration,
        image: item.image,
      };
    });

    res.status(200).json(servicesData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
