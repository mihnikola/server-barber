const AboutUs = require("../models/AboutUs");

exports.createAbout = async (req, res) => {
  const {
    lang,
    title,
    text,
    textTwo,
    textThree,
    workDays,
    workSaturday,
    holidays,
  } = req.body;

  try {
    const aboutData = new AboutUs({
      lang,
      title,
      text,
      textTwo,
      textThree,
      workDays,
      workSaturday,
      holidays,
    });

    await aboutData.save();

    res.status(200).json(aboutData);
  } catch (err) {
    console.log("errr",err)
    res.status(500).json({ message: err.message });
  }
};
