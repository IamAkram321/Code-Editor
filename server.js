// server.js
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
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"],
    },
});

app.use(express.static('dist'))
app.use((req,res,next)=>{
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
})

const userSocketMap = {};
const codeData = {}; 
const roomSettings = {}; // Store language, theme per room
const roomFiles = {}; // Store files per room

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId],
        };
    });
}

io.on("connection", (socket) => {
    console.log("socket connected", socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        if (!roomId || !username) {
            console.error("Invalid join request:", { roomId, username });
            return;
        }

        userSocketMap[socket.id] = username;
        socket.join(roomId);
        socket.roomId = roomId;
        socket.username = username;

        const clients = getAllConnectedClients(roomId);
        console.log(`Room ${roomId} clients:`, clients);

        // Initialize room settings if not exists
        if (!roomSettings[roomId]) {
            roomSettings[roomId] = {
                language: "javascript",
                theme: "dracula",
            };
        }

        // Initialize room files if not exists
        if (!roomFiles[roomId]) {
            roomFiles[roomId] = [{ id: "1", name: "main", language: "javascript" }];
        }

        // Notify everyone in the room about the joined user
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });

        // Send current room settings to the new user
        socket.emit(ACTIONS.LANGUAGE_CHANGE, { language: roomSettings[roomId].language });
        socket.emit(ACTIONS.THEME_CHANGE, { theme: roomSettings[roomId].theme });

        // Send file list to the new user
        socket.emit("file-list", { files: roomFiles[roomId] });

        // If there is existing code for this room, send it to the newly joined socket
        if (codeData[roomId]) {
            socket.emit(ACTIONS.CODE_CHANGE, { code: codeData[roomId] });
        }
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        // Save the latest code for the room
        if (roomId) {
            codeData[roomId] = code;
        }

        // Broadcast to other clients in the room (exclude sender)
        socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.CURSOR_CHANGE, ({ roomId, cursor, socketId }) => {
        // Broadcast cursor position to other clients
        socket.to(roomId).emit(ACTIONS.CURSOR_CHANGE, {
            cursor,
            socketId: socketId || socket.id,
            username: userSocketMap[socketId || socket.id],
        });
    });

    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
        if (roomId && language && roomSettings[roomId]) {
            roomSettings[roomId].language = language;
            // Broadcast language change to all clients in the room (including sender)
            io.to(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
        }
    });

    socket.on(ACTIONS.THEME_CHANGE, ({ roomId, theme }) => {
        if (roomId && theme && roomSettings[roomId]) {
            roomSettings[roomId].theme = theme;
            // Broadcast theme change to all clients in the room (including sender)
            io.to(roomId).emit(ACTIONS.THEME_CHANGE, { theme });
        }
    });

    // Chat functionality
    socket.on("chat-message", ({ roomId, username, message, timestamp }) => {
        if (roomId && username && message) {
            io.to(roomId).emit("chat-message", {
                username,
                message,
                timestamp,
            });
        }
    });

    // File management
    socket.on("get-file-list", ({ roomId }) => {
        if (roomId && roomFiles[roomId]) {
            socket.emit("file-list", { files: roomFiles[roomId] });
        }
    });

    socket.on("add-file", ({ roomId, file }) => {
        if (roomId && file) {
            if (!roomFiles[roomId]) {
                roomFiles[roomId] = [];
            }
            // Check if file already exists
            if (!roomFiles[roomId].some(f => f.id === file.id)) {
                roomFiles[roomId].push(file);
                io.to(roomId).emit("file-added", { file });
            }
        }
    });

    socket.on("remove-file", ({ roomId, fileId }) => {
        if (roomId && fileId && roomFiles[roomId]) {
            roomFiles[roomId] = roomFiles[roomId].filter((f) => f.id !== fileId);
            io.to(roomId).emit("file-removed", { fileId });
        }
    });

    socket.on("disconnecting", () => {
        const rooms = [...socket.rooms]; // includes socket.id and joined rooms
        const username = userSocketMap[socket.id];
        
        rooms.forEach((roomId) => {
            if (roomId === socket.id) return; // skip personal room
            // Only notify if user was actually in the room
            if (username) {
                socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
                    socketId: socket.id,
                    username: username,
                });
            }
        });
    });

    socket.on("disconnect", (reason) => {
        console.log("socket disconnected", socket.id, reason);
        delete userSocketMap[socket.id];
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
