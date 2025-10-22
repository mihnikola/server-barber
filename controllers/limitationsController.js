const CountReservation = require("../models/CountReservation");

exports.getLimitations = async (req, res) => {
  try {
    const limitations = await CountReservation.findOne();
    res.status(200).json({ status: 200, data: limitations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.putLimitations = async (req, res) => {
  try {
    const { id } = req.params;
    const { daily, weekly, monthly } = req.body;
    const limitation = await CountReservation.findByIdAndUpdate(
      id,
      { counterDaily: daily, counterWeekly: weekly, counterMonthly: monthly },
      { new: true }
    );

    if (!limitation) {
      return res.status(404).send("Limitation is not found");
    }

    return res
      .status(200)
      .json({ status: 202, message: "Limitation is updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error });
  }
};
