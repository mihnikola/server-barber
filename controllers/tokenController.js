const Token = require("../models/Token");

// API route to send token

exports.sendNotification = async (req, res) => {
  const { token, title, content,data } = req.body;

  const message = {
    to: token,
    sound: "default",
    title: title,
    body: content,
    data: { someData: data },
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
      if (solve.status === 400) {
        res
          .status(500)
          .send(`${solve.statusText} Notification cannot successfully`);
      } else {
        res.status(200).send("Notification sent successfully");
      }
    })
    .catch((err) => {
      res.status(500).send("Notification cannot successfully");
    });
};
// API route to save token

exports.saveToken = async (req, res) => {
  const { tokenExpo, tokenUser } = req.body;
  try {
    const tokens = await Token.findOne({ token: tokenExpo });
    if (tokens) {
      return res.status(200).send("Token already exist");
    }
    const newToken = new Token({ token: tokenExpo, user: tokenUser });
    await newToken.save();

    res.status(200).send("Token saved successfully");
  } catch (error) {
    res.status(500).send("Token is not saved successfully");
  }
};
