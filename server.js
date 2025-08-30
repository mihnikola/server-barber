const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

const tokenRoutes = require('./routes/tokenRoutes');
const reservationAdminRoutes = require('./routes/reservationAdminRoutes');
const userRoutes = require("./routes/userRoutes");
const userAdminRoutes = require("./routes/userAdminRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const notificationsRoutes = require("./routes/notificationRoutes");
const timesRoutes = require("./routes/timesRoutes");
const timeAdminRoutes = require("./routes/timeAdminRoutes");
const { default: connectDB } = require("./connectDB");

// --- Konfiguracija Express aplikacije ---
app.use(cors());

// Middleware za parsiranje JSON i URL-enkodiranih tela

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Serviranje statičkih fajlova
app.use(express.static('public')); // Za fajlove u 'public' folderu
app.use('/images', express.static('images')); // Za fajlove u 'images' folderu, dostupne preko /images URL-a

// --- Definisanje ruta ---
app.use('/api',tokenRoutes);
app.use("/users", userRoutes);
app.use("/admin/reservations", reservationAdminRoutes);
app.use("/admin/users", userAdminRoutes);
app.use("/services", serviceRoutes);
app.use("/reservations", reservationRoutes);
app.use("/times", timesRoutes);
app.use("/admin/times", timeAdminRoutes);
app.use("/notifications", notificationsRoutes);

const PORT = process.env.PORT || 3000;

async function startApp() {
  const dbConnected = await connectDB(); // Pokušaj konekcije sa bazom podataka

  if (dbConnected) {
    // Ako je konekcija sa bazom uspela, pokreni server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } else {
    
    console.error("Server not started due to database connection failure.");
    process.exit(1) 
  }
}
startApp();
