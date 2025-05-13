const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
