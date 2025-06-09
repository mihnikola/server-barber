import mongoose from "mongoose";

// --- Funkcija za povezivanje sa bazom podataka ---
const connectDB = async () => {
  const uri =
    "mongodb+srv://root:3Slap3hMgxH8V3pm@cluster0.szwql.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000, // Daje više vremena za odabir servera
    });
    console.log("Database connected successfully to MongoDB");
    return true; // Vraća true ako je konekcija uspela
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    return false; // Vraća false ako je došlo do greške
  }
};

export default connectDB;
