const mongoose = require('mongoose');
const uri = "mongodb+srv://root:3Slap3hMgxH8V3pm@cluster0.szwql.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function connectDB() {
  try {
    // Connect to MongoDB (replace the connection string with your database URL if needed)
    await mongoose.connect(uri);

    // Log a success message when the connection is successful
    console.log('Database connected successfully to MongoDB');
  } catch (error) {
    // Log any errors during connection
    console.error('Error connecting to MongoDB:', error);
  }
}

module.exports = connectDB;