// backend/config/db.js
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment (.env)");
}

mongoose.set("strictQuery", true); // matches guidance in tutorials for clean queries [web:90]

const connectDB = async () => {
  try {
    // Use a single shared connection per app lifecycle as recommended by Mongoose docs [web:87]
    const conn = await mongoose.connect(MONGODB_URI, {
      // Add options here if needed; driver options are supported per docs [web:87][web:99]
      autoIndex: true, // OK for dev; disable in prod if indexes are large [web:87]
      maxPoolSize: 10, // reasonable pool size for dev [web:87]
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
    // Useful connection event logs, following common patterns [web:91]
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB error:", err.message);
    });

    return conn;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
