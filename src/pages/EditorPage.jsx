// src/pages/EditorPage.jsx
import React, { useState, useRef, useEffect } from "react";
import Client from "../components/Clients";
import toast from "react-hot-toast";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import ACTIONS from "./Actions";
import { useLocation, useParams, useNavigate, Navigate } from "react-router-dom";

const EditorPage = () => {
  const socketRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [username, setUsername] = useState(
    location.state?.username || localStorage.getItem("username") || ""
  );
  const [clients, setClients] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    if (!username) {
      navigate("/", { replace: true });
      return;
    }
    localStorage.setItem("username", username);

    const init = async () => {
      socketRef.current = await initSocket();

      const socket = socketRef.current;

      socket.on("connect_error", handleErrors);
      socket.on("connect_failed", handleErrors);

      function handleErrors(e) {
        console.error("Socket connection error:", e);
        toast.error("Socket connection failed, try again later.");
        navigate("/", { replace: true });
      }

      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        // mark connected so Editor can attach listeners
        setSocketConnected(true);

        // Join the room (server will respond with JOINED and possibly CODE_CHANGE)
        socket.emit(ACTIONS.JOIN, {
          roomId,
          username,
        });
      });

      socket.on(ACTIONS.JOINED, ({ clients: updatedClients, username: joinedUsername }) => {
        setClients(updatedClients);
        if (joinedUsername && joinedUsername !== username) {
          toast.success(`${joinedUsername} has joined the room.`);
        }
      });

      socket.on(ACTIONS.DISCONNECTED, ({ socketId, username: leftUsername }) => {
        toast(`${leftUsername} left the room.`);
        setClients((prev) => prev.filter((c) => c.socketId !== socketId));
      });
    };

    init();

    // cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      }
    };
  }, [roomId, username, navigate]);

  if (!username) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">

      
      
      <div className="w-64 bg-gray-800 flex flex-col justify-between border-r border-gray-700">
        <div>
          <div className="p-4 border-b border-gray-700 flex justify-center">
            <img src="/icon.png" alt="logo" className="max-h-16 w-auto" />
          </div>

          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Connected</h3>
            <div className="grid grid-cols-2 gap-4">
              {clients.map((client) => (
                <div
                  key={client.socketId}
                  className="flex flex-col items-center text-center"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${client.username}&background=4ade80&color=fff&size=64`}
                    alt={client.username}
                    className="w-12 h-12 rounded-full mb-1"
                  />
                  <span className="text-sm break-words">{client.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded text-white transition duration-200 font-bold"
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              toast.success("Room ID copied to clipboard!");
            }}
          >
            Copy ROOM ID
          </button>


          <button
            className="w-full bg-red-600 hover:bg-red-700 py-2 px-4 rounded text-white transition duration-200 font-bold"
            onClick={() => {
              navigate("/", { replace: true });
              localStorage.removeItem("username");
            }}
          >
            Leave
          </button>


        </div>
      </div>


      <div className="flex-1 h-screen overflow-hidden">
        <Editor socketRef={socketRef} roomId={roomId} socketConnected={socketConnected} />
      </div>
    </div>
  );
};

export default EditorPage;
