const { default: Expo } = require("expo-server-sdk");
const expo = new Expo();

const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");



exports.sendNotification = async (req, res) => {
  const { status, tokenExpo } = req.body.params;
  try {
    let messages = []; // Initialize messages as an empty array

      if (Expo.isExpoPushToken(tokenExpo)) {
        messages.push({ // Push a single message object into the array
          to: tokenExpo,
          sound: "default",
          body: "Pa brate nek je sa srecom puno zdravlja. Vucicu pederu. Partizan sampion",
        });
      } else {
        console.log(`Invalid Expo push token: ${tokenExpo}`);
      }

    if (messages.length > 0) { // Check if the messages array has any elements
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (let chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error(error);
        }
      }

      console.log("Push notifications sent:", tickets);
      res.status(200).send("Notification sent successfully");
    } else {
      res.status(400).send("No valid Expo tokens found");
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).send(`Failed to send notification ${error} `);
  }
};
// Create a new customer
exports.createNotification = async (req, res) => {
  const currentDate = new Date().toISOString();
  try {
    const { token } = req.body.params;

    const text = `Obavestenje`;
    const isRead = false;
    // const  expiredDate for notifications

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const newNotification = new Notification({
      text,
      isRead,
      date: currentDate,
      user_id: decoded.id,
    });
    await newNotification.save();

    res.status(201).json({ message: "Notification created successfully" });

    // // try {
    // // Fetch all stored tokens from MongoDB
    // const users = await User.find({ _id: decoded.id });

    // // Prepare push notifications payload for each token
    // let messages = [];
    // // for (let user of users) {
    //   if (Expo.isExpoPushToken(decoded.token)) {
    //     messages.push({
    //       to: decoded.token, // Expo push token
    //       sound: "default",
    //       body: text,
    //     });
    //   } else {
    //     console.log(`Invalid Expo push token: ${token.token}`);
    //   }
    // // }

    // if (messages.length > 0) {
    //   // Send notifications through Expo's service
    //   const chunks = expo.chunkPushNotifications(messages);
    //   const tickets = [];

    //   for (let chunk of chunks) {
    //     try {
    //       const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    //       tickets.push(...ticketChunk);
    //     } catch (error) {
    //       console.error(error);
    //     }
    //   }

    //   console.log("Push notifications sent:", tickets);
    // res.status(200).send("Notification sent successfully");
    // } else {
    //   res.status(400).send("No valid Expo tokens found");
    // }
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).send("Failed to send notification");
  }
};

// Get all customers
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Patch all notifications
// exports.patchNotification = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { isRead } = req.body.params;

//     const notification = await Notification.findByIdAndUpdate(
//       id,
//       { isRead },
//       { new: true }
//     );
//     if (!notification) {
//       return res.status(404).send("Notification not found");
//     }

//     res.status(200).json({ message: "Notification is read" });
//   } catch (error) {
//     res.status(500).send(error);
//   }
// };
