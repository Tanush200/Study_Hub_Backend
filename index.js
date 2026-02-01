const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");
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
    "https://notevaultt.org",
    "https://www.notevaultt.org"
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

// Enable trust proxy for rate limiting behind load balancers (Render, Heroku, etc.)
app.set('trust proxy', 1);

// Use raw body for webhook route
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== Rate Limiting ====================
// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication routes - 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many login/registration attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests (only count failed attempts)
  skipSuccessfulRequests: false,
});

// Apply general rate limiting to all API routes (moved after route registration)
// app.use('/api/', apiLimiter);

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

  // Helper to update and broadcast user count
  const updateRoomUserCount = async (roomId) => {
    try {
      const sockets = await io.in(roomId).fetchSockets();
      const uniqueUsers = new Set(sockets.map(s => s.handshake.query.userId)).size;

      // Update DB for persistence
      await Room.findOneAndUpdate({ roomId }, { activeUsers: uniqueUsers });

      // Broadcast accurate count
      io.to(roomId).emit("room_users_count", uniqueUsers);
    } catch (err) {
      console.error("Error updating room user count:", err);
    }
  };

  socket.on("join_room", async (roomId) => {
    socket.join(roomId);
    await updateRoomUserCount(roomId);

    // Update DB (Legacy increment, kept for safety but overwritten by updateRoomUserCount)
    try {
      const room = await Room.findOne({ roomId });

      // Send chat history to the user who just joined
      if (room && room.messages) {
        socket.emit("load_messages", room.messages);
      }
      // Send whiteboard history
      if (room && room.whiteboardData) {
        socket.emit("load-canvas", room.whiteboardData);
      }

      // Send To-Do List
      if (room && room.todoList) {
        socket.emit("load_todos", room.todoList);
      }

      // Send Notes
      if (room && room.notes) {
        socket.emit("receive_notes", room.notes);
      }
    } catch (err) {
      console.error("Error fetching room data:", err);
    }

    // Notify others in the room
    socket.to(roomId).emit("user_joined", { userId: socket.id });

    // Get other users in the room for WebRTC
    const sockets = await io.in(roomId).fetchSockets();
    const usersInRoom = sockets.map(s => s.id).filter(id => id !== socket.id);
    socket.emit("all_users", usersInRoom);
  });

  // ==================== Note Events ====================
  socket.on("update_notes", async (data) => {
    try {
      const { roomId, notes } = data;

      // Save to database (debounced in frontend, but good to save here too)
      await Room.findOneAndUpdate({ roomId }, { notes });

      // Broadcast to other users
      socket.to(roomId).emit("receive_notes", notes);
    } catch (err) {
      console.error("Error updating notes:", err);
    }
  });

  // ==================== Chat Message Events ====================
  socket.on("send_message", async (data) => {
    try {
      const { roomId, sender, message, time } = data;

      // Save message to database
      await Room.findOneAndUpdate(
        { roomId },
        { $push: { messages: { sender, message, time } } }
      );

      // Broadcast message to all users in the room
      io.to(roomId).emit("receive_message", { sender, message, time });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  });

  // ==================== Todo List Events ====================
  socket.on("add_todo", async (data) => {
    try {
      const { roomId, text } = data;

      const room = await Room.findOneAndUpdate(
        { roomId },
        { $push: { todoList: { text, completed: false } } },
        { new: true }
      );

      // Broadcast updated todo list to all users
      io.to(roomId).emit("todo_updated", room.todoList);
    } catch (err) {
      console.error("Error adding todo:", err);
    }
  });

  socket.on("toggle_todo", async (data) => {
    try {
      const { roomId, todoId } = data;

      const room = await Room.findOne({ roomId });
      const todo = room.todoList.id(todoId);

      if (todo) {
        todo.completed = !todo.completed;
        await room.save();

        // Broadcast updated todo list to all users
        io.to(roomId).emit("todo_updated", room.todoList);
      }
    } catch (err) {
      console.error("Error toggling todo:", err);
    }
  });

  socket.on("delete_todo", async (data) => {
    try {
      const { roomId, todoId } = data;

      const room = await Room.findOneAndUpdate(
        { roomId },
        { $pull: { todoList: { _id: todoId } } },
        { new: true }
      );

      // Broadcast updated todo list to all users
      io.to(roomId).emit("todo_updated", room.todoList);
    } catch (err) {
      console.error("Error deleting todo:", err);
    }
  });

  // ==================== Whiteboard Events ====================
  socket.on("drawing", async (data) => {
    try {
      const { roomId, x0, y0, x1, y1, color, size, tool } = data;

      // Save drawing to database
      await Room.findOneAndUpdate(
        { roomId },
        { $push: { whiteboardData: { x0, y0, x1, y1, color, size, tool } } }
      );

      // Broadcast drawing to other users in the room
      socket.to(roomId).emit("drawing", data);
    } catch (err) {
      console.error("Error saving drawing:", err);
    }
  });

  socket.on("clear-canvas", async (data) => {
    try {
      const { roomId } = data;

      // Clear whiteboard data in database
      await Room.findOneAndUpdate(
        { roomId },
        { $set: { whiteboardData: [] } }
      );

      // Broadcast clear to all users in the room
      io.to(roomId).emit("clear-canvas");
    } catch (err) {
      console.error("Error clearing canvas:", err);
    }
  });

  // ==================== Voice Chat Events (WebRTC Signaling) ====================
  socket.on("join_voice", async (roomId) => {
    try {
      const sockets = await io.in(roomId).fetchSockets();
      const users = sockets
        .filter(s => s.id !== socket.id)
        .map(s => ({
          id: s.id,
          username: s.handshake.query.username || "Anonymous",
          handRaised: s.data.handRaised || false
        }));
      socket.emit("all_voice_users", users);
    } catch (err) {
      console.error("Error in join_voice:", err);
    }
  });

  socket.on("sending_signal", (payload) => {
    io.to(payload.userToSignal).emit("user_joined_voice", {
      signal: payload.signal,
      callerID: payload.callerID,
      username: payload.username
    });
  });

  socket.on("returning_signal", (payload) => {
    io.to(payload.callerID).emit("receiving_returned_signal", {
      signal: payload.signal,
      id: socket.id
    });
  });

  socket.on("send_reaction", (data) => {
    const { roomId, emoji } = data;
    io.to(roomId).emit("user_reaction", { userId: socket.id, emoji });
  });

  socket.on("toggle_hand", (data) => {
    const { roomId, isRaised } = data;
    socket.data.handRaised = isRaised;
    io.to(roomId).emit("user_hand_updated", { userId: socket.id, isRaised });
  });

  // ==================== Cursor Events ====================
  socket.on("cursor_move", (data) => {
    const { roomId, position, username, userId } = data;
    // Broadcast cursor position to other users in the room
    socket.to(roomId).emit("cursor_update", { userId, username, position });
  });

  // ==================== Room Events ====================
  socket.on("leave_room", async (roomId) => {
    socket.leave(roomId);
    await updateRoomUserCount(roomId);
    socket.to(roomId).emit("user_left", { userId: socket.id });
  });

  socket.on("disconnecting", async () => {
    const rooms = [...socket.rooms];
    for (const roomId of rooms) {
      if (roomId !== socket.id) {
        try {
          const sockets = await io.in(roomId).fetchSockets();
          // Filter out the current socket (which is disconnecting)
          const remainingSockets = sockets.filter(s => s.id !== socket.id);
          const uniqueUsers = new Set(remainingSockets.map(s => s.handshake.query.userId)).size;

          await Room.findOneAndUpdate({ roomId }, { activeUsers: uniqueUsers });
          socket.to(roomId).emit("room_users_count", uniqueUsers);
          socket.to(roomId).emit("user_left", { userId: socket.id });
        } catch (err) {
          console.error("Error handling disconnect:", err);
        }
      }
    }
  });

  socket.on("disconnect", () => {
  });
});

// ==================== Routes ====================
// Apply strict rate limiting to auth routes
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/health", require("./routes/health"));
app.use("/api", commentRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookmarks", Bookmark);
app.use("/api/gamification", require("./routes/gamification"));
app.use("/api/forum", forumRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/groups", require("./routes/groups"));
app.use("/api/payments", require("./routes/payments"))
app.use("/api/upload", require("./routes/upload"));
app.use("/api/support", require("./routes/support"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/admin/users", require("./routes/userAdminRoutes"));

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
