const { put } = require("@vercel/blob");
const Service = require("../models/Service");


require("dotenv").config();

// Create a new service with image upload
exports.createService = async (req, res) => {
  try {
    // Extracting values from the request body
    const { serviceName, serviceDuration, servicePrice } = req.body;
    const updateData = {};
   if (req.file && req.file.buffer) {

      const fileName = `${Date.now()}-${req.file.originalname}`;

      // ✅ Upload to Vercel Blob using SDK
      const blob = await put(fileName, req.file.buffer, {
        access: "public", // 👈 MAKE IT PUBLIC
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      updateData.image = blob.url; // ✅ This is a public URL
    }
    const {image} = updateData;
    const newService = new Service({
      name: serviceName,
      price: servicePrice,
      duration: serviceDuration,
      image,
    });

    // // Save the new service to the database
    await newService.save();

    // // Return the saved service as a response
    res.status(201).json(newService);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteService = async (req, res) => {
  try {
    const id = req.params.id;
    await Service.findByIdAndDelete(id);
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.putService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, duration } = req.body;

     const updateData = {};
   if (req.file && req.file.buffer) {

      const fileName = `${Date.now()}-${req.file.originalname}`;

      // ✅ Upload to Vercel Blob using SDK
      const blob = await put(fileName, req.file.buffer, {
        access: "public", // 👈 MAKE IT PUBLIC
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      updateData.image = blob.url; // ✅ This is a public URL
    }
    const {image} = updateData;
    const service = await Service.findByIdAndUpdate(
      id,
      { name, price, duration, image },
      { new: true }
    );
    if (!service) {
      return res.status(404).send("Service not found");
    }
    res.status(200).json({ message: "Service updated successfully" });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

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

exports.getService = async (req, res) => {


  try {
    const id = req.params.id;

    const service = await Service.findOne({ _id: id });

    const serviceData = {
      id: service._id,
      name: service.name,
      price: service.price,
      duration: service?.duration,
    };

    res.status(200).json({ status: 200, data: serviceData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};