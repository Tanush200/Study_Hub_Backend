const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment (.env)");
}

mongoose.set("strictQuery", true);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
      maxPoolSize: 10,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
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
