import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";



import authRoutes from "./routes/auth.js";
import testRoutes from "./routes/test.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());


app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);

const PORT = process.env.PORT || 5000;


connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
