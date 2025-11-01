const { default: axios } = require("axios");
const Token = require("../models/Token");
const admin = require("firebase-admin");
// const serviceAccount = require("../helpers/barberappointmentapp-85deb-firebase-adminsdk-fbsvc-addb7bb47c.json");
require("dotenv").config(); // učitava .env fajl

// API route to send token
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});
exports.sendNotification = async (req, res) => {
  const { token, title, content, data } = req.body;

  const message = {
    token,
    notification: {
      title,
      body: content,
    },
    data, // dodatni payload (npr. { url: 'reservationId' })
    android: {
      notification: {
        channelId: "default", // mora da se poklapa sa kanalom na Android-u
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent successfully:", response);
  } catch (error) {
    console.error("🔥 Error sending notification:", error);
  }
};
// API route to save token
async function updateTokenFirebase(userId, token) {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/updateTokenExpoPushToFirestore";
  await axios
    .post(functionUrl, { userId, token })
    .then((res) => {
      console.log("data", res.data);

      return true;
    })
    .catch((err) => {
      console.log("err", err);

      return false;
    });
}

async function changeLanguageFirebase(data) {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/addOrUpdateLanguageLocalization";
  const responseEmail = await axios
    .post(functionUrl, data)
    .then((res) => {
      console.log("langauge value solve", res.data);
      return true;
    })
    .catch((err) => {
      console.log("err", err);
      return false;
    });

  return responseEmail;
}

exports.saveToken = async (req, res) => {
  const { tokenExpo, tokenUser, lang } = req.body;

  try {
    const userData = await Token.findOne({ user: tokenUser });
    if (userData) {
      await Token.findOneAndUpdate(
        { user: tokenUser },
        { $set: { token: tokenExpo } },
        { new: true }
      );
      const x = await updateTokenFirebase(tokenUser, tokenExpo);
      console.log("updateTokenFirebase x", x);
      const contentData = { userId: tokenUser, token: tokenExpo, lang };

      const y = await changeLanguageFirebase(contentData);
      console.log("changeLanguageFirebase y", y);

      return res
        .status(200)
        .send({ status: 200, message: "Token updated successfully" });
    } else {
      const newToken = new Token({ token: tokenExpo, user: tokenUser });
      await newToken.save();

      return res
        .status(200)
        .send({ status: 200, message: "Token saved successfully" });
    }
  } catch (error) {
    res
      .status(500)
      .send({ status: 500, message: "Token is not saved successfully" });
  }
};
