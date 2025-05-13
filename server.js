const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
app.use(cors());
const tokenRoutes = require('./routes/tokenRoutes');
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const timesRoutes = require("./routes/timesRoutes");

const connectDB = require('./connectDB.js');
// Middleware to parse JSON
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json({ limit: "50mb" }));

app.use(express.static('public'));
app.use('images', express.static('images'));

connectDB();
app.use('/api',tokenRoutes);
app.use("/users", userRoutes);
app.use("/services", serviceRoutes);
app.use("/reservations", reservationRoutes);
app.use("/times", timesRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app
