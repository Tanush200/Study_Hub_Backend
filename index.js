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
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Import routes
const commentRoutes = require("./routes/comments");
const followRoutes = require("./routes/follow");
const userRoutes = require("./routes/users");
const Bookmark = require("./routes/bookmark");
const forumRoutes = require("./routes/forum");
const roomRoutes = require("./routes/rooms");

const app = express();
const server = http.createServer(app);
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

// ==================== Socket.io Setup ====================
const io = new Server(server, {
  cors: {
    origin: allowedDomains,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const Room = require("./models/Room");

io.on("connection", (socket) => {

  socket.on("join_room", async (roomId) => {
    socket.join(roomId);

    // Update DB
    try {
      const room = await Room.findOneAndUpdate(
        { roomId },
        { $inc: { activeUsers: 1 } },
        { new: true }
      );

      // Send chat history to the user who just joined
      if (room && room.messages) {
        socket.emit("load_messages", room.messages);
      }

      // Send whiteboard history
      if (room && room.whiteboardData) {
        socket.emit("load-canvas", room.whiteboardData);
      }
    } catch (err) {
      console.error("Error updating room user count:", err);
    }

    // Notify others in the room
    socket.to(roomId).emit("user_joined", { userId: socket.id });

    // Get other users in the room for WebRTC
    const sockets = await io.in(roomId).fetchSockets();
    const usersInRoom = sockets.map(s => s.id).filter(id => id !== socket.id);
    socket.emit("all_users", usersInRoom);
  });

  socket.on("sending_signal", (payload) => {
    io.to(payload.userToSignal).emit("user_joined_signal", { signal: payload.signal, callerID: payload.callerID });
  });

  socket.on("returning_signal", (payload) => {
    io.to(payload.callerID).emit("receiving_returned_signal", { signal: payload.signal, id: socket.id });
  });

  socket.on("send_message", async (data) => {
    // Save message to DB
    try {
      await Room.findOneAndUpdate(
        { roomId: data.roomId },
        { $push: { messages: data } }
      );
    } catch (err) {
      console.error("Error saving message:", err);
    }

    io.to(data.roomId).emit("receive_message", data);
  });

  socket.on("timer_update", (data) => {
    socket.to(data.roomId).emit("timer_sync", data);
  });

  socket.on("music_update", (data) => {
    socket.to(data.roomId).emit("music_sync", data);
  });

  // Whiteboard Events
  socket.on("canvas-data", async (data) => {
    socket.to(data.roomId).emit("canvas-data", data);
    // Save to DB
    try {
      await Room.findOneAndUpdate(
        { roomId: data.roomId },
        { $push: { whiteboardData: data } }
      );
    } catch (err) {
      console.error("Error saving whiteboard data:", err);
    }
  });

  socket.on("clear-canvas", async (roomId) => {
    socket.to(roomId).emit("clear-canvas");
    // Clear DB
    try {
      await Room.findOneAndUpdate(
        { roomId },
        { $set: { whiteboardData: [] } }
      );
    } catch (err) {
      console.error("Error clearing whiteboard data:", err);
    }
  });

  socket.on("request-canvas", async (roomId) => {
    try {
      const room = await Room.findOne({ roomId });
      if (room && room.whiteboardData) {
        socket.emit("load-canvas", room.whiteboardData);
      }
    } catch (err) {
      console.error("Error fetching whiteboard data:", err);
    }
  });

  socket.on("leave_room", async (roomId) => {
    socket.leave(roomId);
    try {
      await Room.findOneAndUpdate(
        { roomId },
        { $inc: { activeUsers: -1 } }
      );
      // Notify others
      socket.to(roomId).emit("user_left", { userId: socket.id });
    } catch (err) {
      console.error("Error updating room user count:", err);
    }
  });

  socket.on("disconnecting", async () => {
    const rooms = [...socket.rooms];
    for (const roomId of rooms) {
      if (roomId !== socket.id) {
        try {
          await Room.findOneAndUpdate(
            { roomId },
            { $inc: { activeUsers: -1 } }
          );
          // Notify others
          socket.to(roomId).emit("user_left", { userId: socket.id });
        } catch (err) {
          console.error("Error updating room user count:", err);
        }
      }
    }
  });

  socket.on("disconnect", () => {
  });
});

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
app.use("/api/rooms", roomRoutes);

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
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
