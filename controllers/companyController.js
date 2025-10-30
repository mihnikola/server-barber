const AboutUs = require("../models/AboutUs");
const Company = require("../models/Company");
const Review = require("../models/Review");

exports.getCompany = async (req, res) => {
  const lang = req.headers["language"];
console.log("getCompany")
  try {
    const aboutUs = await AboutUs.findOne({ lang }).lean();
    const reviews = await Review.find({ lang });
    const companies = await Company.findOne();

    const companiesData = {
      _id: companies._id,
      name: companies.name,
      contact: companies.contact,
      media: companies.media,
    };
    const company = {
      ...companiesData,
      aboutUs: {
        title: aboutUs.title,
        lang: aboutUs.lang,
        text: aboutUs.text,
        textTwo: aboutUs.textTwo,
        textThree: aboutUs.textThree,
        workDays: aboutUs.workDays,
        workSaturday: aboutUs.workSaturday,
        holidays: aboutUs.holidays,
      },
      reviews,
    };
    res.status(200).json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
