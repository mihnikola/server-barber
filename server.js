const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

// --- Konfiguracija Express aplikacije ---
app.use(cors());

// Middleware za parsiranje JSON i URL-enkodiranih tela

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Serviranje statičkih fajlova
app.use(express.static('public')); // Za fajlove u 'public' folderu
app.use('/images', express.static('images')); // Za fajlove u 'images' folderu, dostupne preko /images URL-a

// --- Importovanje ruta ---
const tokenRoutes = require('./routes/tokenRoutes');
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const notificationsRoutes = require("./routes/notificationRoutes");
const timesRoutes = require("./routes/timesRoutes");

// --- Definisanje ruta ---
app.use('/api',tokenRoutes);
app.use("/users", userRoutes);
app.use("/services", serviceRoutes);
app.use("/reservations", reservationRoutes);
app.use("/times", timesRoutes);
app.use("/notifications", notificationsRoutes);

// --- Funkcija za povezivanje sa bazom podataka ---
async function connectDB() {
  const uri =
    "mongodb+srv://root:3Slap3hMgxH8V3pm@cluster0.szwql.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000 // Daje više vremena za odabir servera
    });
    console.log("Database connected successfully to MongoDB");
    return true; // Vraća true ako je konekcija uspela
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    return false; // Vraća false ako je došlo do greške
  }
}

// --- Glavna funkcija za pokretanje servera ---
const PORT = process.env.PORT || 3000;

async function startApp() {
  const dbConnected = await connectDB(); // Pokušaj konekcije sa bazom podataka

  
  if (!dbConnected) {
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
















