import express from "express";
import http from "http";
import { Server } from "socket.io";
import ACTIONS from "./src/pages/Actions.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === "production";

const io = new Server(server, {
  cors: {
    origin: isProduction ? undefined : "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId],
    })
  );
}

//socket logic
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);

    const clients = getAllConnectedClients(roomId);

    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on("chat-message", ({ roomId, username, message, timestamp }) => {
    io.to(roomId).emit("chat-message", {
      username,
      message,
      timestamp,
    });
  });

  socket.on("disconnect", () => {
    delete userSocketMap[socket.id];
    console.log("Socket disconnected:", socket.id);
  });
});


if (isProduction) {
  app.use(express.static("dist"));

  app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

//start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
