// server.js
import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import express from "express"

import authRoutes from "./routes/auth.js";

const app = express();

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
