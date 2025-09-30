const { LOCALIZATION_MAP } = require("../helpers/localizationMap");
const Service = require("../models/Service");

exports.getServices = async (req, res) => {
  const lang = req.headers["language"];
  const localization = LOCALIZATION_MAP[lang]?.SERVICES;
  try {
    const services = await Service.find().sort({ createdAt: 1 });
    const servicesData = services.map((item) => {
      return {
        id: item._id,
        name: localization[item.name] || item.name,
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



