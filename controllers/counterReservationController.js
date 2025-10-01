const CountReservation = require("../models/CountReservation");
exports.createCountReservation = async (req, res) => {
  try {
    const { counterDaily, counterWeekly, counterMonthly, counterYearly } =
      req.body;
    const createCountReservationData = new CountReservation({
      counterDaily,
      counterWeekly,
      counterMonthly,
      counterYearly,
    });
    await createCountReservationData.save();
    res.status(201).json(createCountReservationData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCountReservation = async (req, res) => {
  try {
    const id = req.params.id;
    await CountReservation.findByIdAndDelete(id);
    res.status(200).json({ message: "Count reservation deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCountReservation = async (req, res) => {
  try {
    const countReservationData = await CountReservation.findOne();
    res.status(200).json(countReservationData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.putCountReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { counterDaily, counterWeekly, counterMonthly, counterYearly } =
      req.body;
    const countReservationData = await CountReservation.findByIdAndUpdate(
      id,
      { counterDaily, counterWeekly, counterMonthly, counterYearly },
      { new: true }
    );
    if (!countReservationData) {
      return res.status(404).send("Count reservation data not found");
    }
    res
      .status(200)
      .json({ message: "Count reservation data updated successfully" });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};
