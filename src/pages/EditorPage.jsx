import React, { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useLocation, useParams, useNavigate, Navigate } from "react-router-dom";

import Editor from "../components/Editor";
import LanguageSelector from "../components/LanguageSelector";
import ThemeSelector from "../components/ThemeSelector";
import Chat from "../components/Chat";
import CodeExecutor from "../components/CodeExecutor";

import { initSocket } from "../socket";
import ACTIONS from "./Actions";

const EditorPage = () => {
  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const isInitializedRef = useRef(false);

  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [username] = useState(
    location.state?.username || localStorage.getItem("username") || ""
  );

  const [clients, setClients] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  // JS-only
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dracula"
  );
  const [code, setCode] = useState("");

  // Chat / UI
  const [chatMessages, setChatMessages] = useState([]);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  /*  socket init (once)*/
  useEffect(() => {
    if (!username || isInitializedRef.current) return;

    localStorage.setItem("username", username);

    socketRef.current = initSocket();
    const socket = socketRef.current;

    socket.on("connect", () => {
      setSocketConnected(true);
      isInitializedRef.current = true;
      socket.emit(ACTIONS.JOIN, { roomId, username });
    });

    socket.on("connect_error", () => {
      toast.error("Socket connection failed");
    });

    socket.on(ACTIONS.JOINED, ({ clients }) => {
      setClients(clients);
    });

    socket.on(ACTIONS.DISCONNECTED, ({ socketId }) => {
      setClients((prev) => prev.filter((c) => c.socketId !== socketId));
    });

    // Chat listener (once)
    const onChatMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      if (!showChat) setHasUnreadMessages(true);
    };

    socket.on("chat-message", onChatMessage);

    socket.on(ACTIONS.THEME_CHANGE, ({ theme }) => {
      setTheme(theme);
      localStorage.setItem("theme", theme);
    });

    return () => {
      socket.off("chat-message", onChatMessage);
      socket.disconnect();
    };
  }, [username, roomId]);

  if (!username) {
    return <Navigate to="/" replace />;
  }

  /*handlers */
  const handleThemeChange = useCallback(
    (newTheme) => {
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      socketRef.current?.emit(ACTIONS.THEME_CHANGE, {
        roomId,
        theme: newTheme,
      });
    },
    [roomId]
  );

  const getEditorCode = useCallback(() => {
    return editorRef.current?.getValue?.() || code || "";
  }, [code]);

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col justify-between border-r border-gray-700">
        <div>
          <div className="p-4 border-b border-gray-700 flex justify-center">
            <img src="/icon.png" alt="logo" className="max-h-16" />
          </div>

          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Connected</h3>
            <div className="grid grid-cols-2 gap-4">
              {clients.map((client) => (
                <div
                  key={client.socketId}
                  className="flex flex-col items-center"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${client.username}`}
                    alt={client.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <span className="text-sm">{client.username}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-gray-700 space-y-3">
            <LanguageSelector />
            <ThemeSelector theme={theme} onThemeChange={handleThemeChange} />
          </div>
        </div>

        <div className="p-4 space-y-2 border-t border-gray-700">
          <button
            className="w-full bg-blue-600 py-2 rounded"
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              toast.success("Room ID copied");
            }}
          >
            📋 Copy ROOM ID
          </button>

          <div className="flex gap-2">
            <button
              className={`flex-1 py-2 rounded ${
                showChat ? "bg-blue-700" : "bg-gray-600"
              }`}
              onClick={() => {
                setShowChat(!showChat);
                setHasUnreadMessages(false);
              }}
            >
              💬 Chat {hasUnreadMessages && "●"}
            </button>

            <button
              className={`flex-1 py-2 rounded ${
                showOutput ? "bg-green-700" : "bg-gray-600"
              }`}
              onClick={() => setShowOutput(!showOutput)}
            >
              ▶️ Run
            </button>
          </div>

          <button
            className="w-full bg-red-600 py-2 rounded"
            onClick={() => {
              socketRef.current?.disconnect();
              localStorage.removeItem("username");
              navigate("/", { replace: true });
            }}
          >
            🚪 Leave
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <Editor
          ref={editorRef}
          socketRef={socketRef}
          roomId={roomId}
          socketConnected={socketConnected}
          theme={theme}
          onCodeChange={setCode}
        />

        {showOutput && (
          <div className="h-64 border-t border-gray-700">
            <CodeExecutor getCode={getEditorCode} />
          </div>
        )}
      </div>

      {/* Chat */}
      {showChat && (
        <div className="w-80 bg-gray-800 border-l border-gray-700">
          <Chat
            socketRef={socketRef}
            roomId={roomId}
            username={username}
            messages={chatMessages}
          />
        </div>
      )}
    </div>
  );
};

export default EditorPage;
