const { default: axios } = require("axios");
const Token = require("../models/Token");

// API route to send token

exports.sendNotification = async (req, res) => {
  const { token, title, content, data } = req.body;

  const message = {
    to: token,
    sound: "default",
    title: title,
    body: content,
    data,
  };
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  })
    .then((solve) => {
      console.log("solve++", solve);
      if (solve.status === 400) {
        res
          .status(500)
          .send(`${solve.statusText} Notification cannot successfully`);
      } else {
        res.status(200).send("Notification sent successfully");
      }
    })
    .catch((err) => {
      console.log("solve++", err);

      res.status(500).send("Notification cannot successfully");
    });
};
// API route to save token
async function updateTokenFirebase(userId, token) {
  const functionUrl =
    "https://us-central1-barberappointmentapp-85deb.cloudfunctions.net/updateTokenExpoPushToFirestore";
  await axios
    .post(functionUrl, { userId, token })
    .then((res) => {
      console.log("updateTokenFirebase solve", res.data.message);
    })
    .catch((err) => {
      console.log("err", err);
    });
}

exports.saveToken = async (req, res) => {
  const { tokenExpo, tokenUser } = req.body;

  try {
    const userData = await Token.findOne({ user: tokenUser });
    console.log("tokenExpo", tokenExpo);
    if (userData) {
      await Token.findOneAndUpdate(
        { user: tokenUser },
        { $set: { token: tokenExpo } },
        { new: true }
      );
      updateTokenFirebase(tokenUser, tokenExpo);

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
