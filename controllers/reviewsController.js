const Review = require("../models/Review");

exports.createReview = async (req, res) => {
  const { name, lang, description } = req.body;

  try {
    const reviewData = new Review({
      name,
      lang,
      description,
    });

    await reviewData.save();

    res.status(200).json(reviewData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
