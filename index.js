// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// require("dotenv").config();
// const commentRoutes = require("./routes/comments");
// const followRoutes = require("./routes/follow");
// const userRoutes = require("./routes/users");
// const Bookmark = require("./routes/bookmark");
// const forumRoutes = require("./routes/forum");

// const app = express();
// const PORT = process.env.PORT || 5000;


// app.use(cors());
// app.use(express.json());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));



// app.use("/api/auth", require("./routes/auth"));
// app.use("/api/notes", require("./routes/notes"));
// app.use("/api/health", require("./routes/health"));
// app.use("/api", commentRoutes);
// app.use("/api/follow", followRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/bookmarks", Bookmark)
// app.use("/api/gamification", require("./routes/gamification"));
// app.use("/api/forum", forumRoutes); 

// mongoose
//   .connect(process.env.MONGODB_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.log(err));

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });



const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Import routes
const commentRoutes = require("./routes/comments");
const followRoutes = require("./routes/follow");
const userRoutes = require("./routes/users");
const Bookmark = require("./routes/bookmark");
const forumRoutes = require("./routes/forum");

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== CORS Configuration ====================
const allowedDomains = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((domain) => domain.trim())
  : [
      "http://localhost:3000",
      "https://study-hub-frontend-three.vercel.app",
      "https://your-vercel-frontend.vercel.app",
    ];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedDomains.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Routes ====================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/health", require("./routes/health"));
app.use("/api", commentRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookmarks", Bookmark);
app.use("/api/gamification", require("./routes/gamification"));
app.use("/api/forum", forumRoutes);

// ==================== Database Connection ====================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// ==================== Error Handling ====================
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? "" : err.message,
  });
});

// ==================== Start Server ====================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
