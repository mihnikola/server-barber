const mongoose = require("mongoose");
const uri =
  "mongodb+srv://root:3Slap3hMgxH8V3pm@cluster0.szwql.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function connectDB() {
  try {
    await mongoose.connect(uri,{
        serverSelectionTimeoutMS: 10000

    });
    console.log("Database connected successfully to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

module.exports = connectDB;
