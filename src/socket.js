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
    return io(import.meta.env.VITE_SERVER_URL, options);
};
