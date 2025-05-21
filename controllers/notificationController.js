const Notification = require("../models/Notification");
// const jwt = require("jsonwebtoken");

// Get all notifications
exports.getNotifications = async (req, res) => {
  const { check } = req.query;
  const token = req.header("Authorization")
    ? req.header("Authorization").split(" ")[1]
    : req.body.headers.Authorization
    ? req.body.headers.Authorization
    : req.get("authorization");
  if (!token) return res.status(403).send("Access denied");

  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const notifications = await Notification.find({
      isRead: check,
      // user_id: decoded.id,
    });

    const notificationData = notifications.map((item) => {
      if (item.date < new Date()) {
        const capture = "Termin je uskoro";
        return {
          id: item._id,
          capture,
          isRead: item.isRead,
          date: item.date,
          text: item.text,
        };
      }
    });

    res.status(200).json(notificationData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get one notification
exports.getNotification = async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await Notification.findOne({ _id: id });
    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Patch all notifications
exports.patchNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead },
      { new: true }
    );
    if (!notification) {
      return res.status(404).send("Notification not found");
    }
    res.status(200).json({ message: "Notification is read" });
  } catch (error) {
    res.status(500).send(error);
  }
};
