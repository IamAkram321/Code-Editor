import { io } from "socket.io-client";

export const initSocket = () => {
    const options = {
        "force new connection": true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        transports: ["websocket"],
        upgrade: false,
    };
    // Use environment variable or default to localhost:5000
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
    return io(serverUrl, options);
};
