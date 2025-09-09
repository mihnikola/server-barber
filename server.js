const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

const tokenRoutes = require("./routes/tokenRoutes");
const userRoutes = require("./routes/userRoutes");
const userAdminRoutes = require("./routes/userAdminRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const serviceAdminRoutes = require("./routes/serviceAdminRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const availabilityAdminRoutes = require("./routes/availabilityAdminRoutes");
const timesRoutes = require("./routes/timesRoutes");
const timeAdminRoutes = require("./routes/timeAdminRoutes");
const placeRoutes = require("./routes/placeRoutes");
const placeAdminRoutes = require("./routes/placeAdminRoutes");
const { default: connectDB } = require("./connectDB");

app.use(cors());

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.static("public"));
app.use("/images", express.static("images"));

app.use("/api", tokenRoutes);
app.use("/users", userRoutes);
app.use("/admin/users", userAdminRoutes);
app.use("/services", serviceRoutes);
app.use("/admin/services", serviceAdminRoutes);
app.use("/availabilities", availabilityRoutes);
app.use("/admin/availabilities", availabilityAdminRoutes);
app.use("/times", timesRoutes);
app.use("/admin/times", timeAdminRoutes);
app.use("/places", placeRoutes);
app.use("/admin/places", placeAdminRoutes);

const PORT = process.env.PORT || 3000;

async function startApp() {
  const dbConnected = await connectDB();

  if (dbConnected) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } else {
    console.error("Server not started due to database connection failure.");
    process.exit(1);
  }
}
startApp();
