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
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        socket.roomId = roomId;
        socket.username = username;

        const clients = getAllConnectedClients(roomId);
        console.log(`Room ${roomId} clients:`, clients);

        // Notify everyone in the room about the joined user and send list
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });

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

        // Broadcast to other clients in the room
        socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on("disconnecting", () => {
        const rooms = [...socket.rooms]; // includes socket.id and joined rooms
        rooms.forEach((roomId) => {
            if (roomId === socket.id) return; // skip personal room
            socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
    });

    socket.on("disconnect", () => {
        console.log("socket disconnected", socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
