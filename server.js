const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const commentRoutes = require("./routes/comments");
const followRoutes = require("./routes/follow");
const userRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use("/api/auth", require("./routes/auth"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/health", require("./routes/health"));
app.use("/api", commentRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/users", userRoutes);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
