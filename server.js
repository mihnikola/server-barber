const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Token = require("./Token");
const app = express();
app.use(cors());
const connectDB = require('./connectDB.js');
// Middleware to parse JSON
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json({ limit: "50mb" }));


connectDB();

app.post("/send", async (req, res) => {
  const { token } = req.body;

  const message = {
    to: token,
    sound: "default",
    title: "Original Title",
    body: "And here is the body! 2",
    data: { someData: "goes here" },
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
});

app.post("/saveToken", async (req, res) => {
  const { token } = req.body;

  try {
    const tokens = await Token.findOne({ token });
    if (tokens) {
        return res.status(200).send("Token already exist");
    }
    const newToken = new Token({ token });
    await newToken.save();

    res.status(200).send("Token saved successfully");
} catch (error) {
    res.status(500).send("Token is not saved successfully");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
