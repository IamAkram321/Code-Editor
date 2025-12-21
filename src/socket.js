import { io } from "socket.io-client";

export const initSocket = () => {
    const options = {
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        transports: ["websocket"],
    };

    // DEV vs PROD handling
    const isDev = import.meta.env.DEV;

    const serverUrl = isDev
        ? "http://localhost:5000" // local backend
        : window.location.origin; // Render / production

    return io(serverUrl, options);
};
