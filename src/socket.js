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

    const isDev = import.meta.env.DEV;

    const serverUrl = isDev
        ? "http://localhost:5000" 
        : window.location.origin;

    return io(serverUrl, options);
};
