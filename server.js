const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const cron = require("node-cron");

const tokenRoutes = require("./routes/tokenRoutes");

const userRoutes = require("./routes/userRoutes");
const userAdminRoutes = require("./routes/userAdminRoutes");

const serviceRoutes = require("./routes/serviceRoutes");
const serviceAdminRoutes = require("./routes/serviceAdminRoutes");

const availabilityRoutes = require("./routes/availabilityRoutes");
const availabilityAdminRoutes = require("./routes/availabilityAdminRoutes");

const timesRoutes = require("./routes/timesRoutes");
const timeAdminRoutes = require("./routes/timeAdminRoutes");

const companyRoutes = require("./routes/companyRoutes");
const companyAdminRoutes = require("./routes/companyAdminRoutes");

const placeRoutes = require("./routes/placeRoutes");
const placeAdminRoutes = require("./routes/placeAdminRoutes");

const initialRoutes = require("./routes/initialRoutes");
const initialAdminRoutes = require("./routes/initialAdminRoutes");

const aboutUsRoutes = require("./routes/aboutUsRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const countReservationRoutes = require("./routes/countReservationRoutes");
const employersServicesRoutes = require("./routes/employersServicesRoutes");

const { default: connectDB } = require("./connectDB");
const User = require("./models/User");

app.use(cors());

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.static("public"));
app.use("/images", express.static("images"));

app.use("/api", tokenRoutes);

app.use("/users", userRoutes);
app.use("/admin/users", userAdminRoutes);

app.use("/company", companyRoutes);
app.use("/admin/company", companyAdminRoutes);

app.use("/initial", initialRoutes);
app.use("/admin/initial", initialAdminRoutes);

app.use("/services", serviceRoutes);
app.use("/admin/services", serviceAdminRoutes);

app.use("/availabilities", availabilityRoutes);
app.use("/admin/availabilities", availabilityAdminRoutes);

app.use("/times", timesRoutes);
app.use("/admin/times", timeAdminRoutes);

app.use("/places", placeRoutes);
app.use("/admin/places", placeAdminRoutes);

app.use("/aboutUs", aboutUsRoutes);
app.use("/review", reviewRoutes);
app.use("/countReservation", countReservationRoutes);
app.use("/employersServices", employersServicesRoutes);

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
const deleteOldUsers = async () => {
  try {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const result = await User.deleteMany({
      createdAt: { $lt: threeMonthsAgo },
      isVerified: false,
      role: { $exists: false },
    });

    console.log(
      "Brisanje starih korisnika uspešno završeno (simulacija).",
      result,
      threeMonthsAgo
    );
  } catch (error) {
    console.error("Greška pri brisanju starih korisnika:", error);
  }
};

cron.schedule("0 0 1 * *", () => {
  deleteOldUsers();
});

startApp();
