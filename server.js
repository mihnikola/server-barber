const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
app.use(cors());
const tokenRoutes = require('./routes/tokenRoutes');
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const notificationsRoutes = require("./routes/notificationRoutes");
const timesRoutes = require("./routes/timesRoutes");

// const connectDB = require('./connectDB.js');
// connectDB();






async function connectDB() {
  const uri =
  "mongodb+srv://root:3Slap3hMgxH8V3pm@cluster0.szwql.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  try {
    await mongoose.connect(uri,{
        serverSelectionTimeoutMS: 30000

    });
    console.log("Database connected successfully to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}




// Middleware to parse JSON
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json({ limit: "50mb" }));

app.use(express.static('public'));
app.use('images', express.static('images'));

app.get('/',  (req, res) => {
 connectDB();
})

app.use('/api',tokenRoutes);
app.use("/users", userRoutes);
app.use("/services", serviceRoutes);
app.use("/reservations", reservationRoutes);
app.use("/times", timesRoutes);
app.use("/notifications", notificationsRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  
  console.log(`Server running on port ${PORT}`);
});
