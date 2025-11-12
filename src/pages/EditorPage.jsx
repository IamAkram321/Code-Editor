// src/pages/EditorPage.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import Client from "../components/Clients";
import toast from "react-hot-toast";
import Editor from "../components/Editor";
import LanguageSelector from "../components/LanguageSelector";
import ThemeSelector from "../components/ThemeSelector";
import Chat from "../components/Chat";
import CodeExecutor from "../components/CodeExecutor";
import FileManager from "../components/FileManager";
import { initSocket } from "../socket";
import ACTIONS from "./Actions";
import { useLocation, useParams, useNavigate, Navigate } from "react-router-dom";
import { downloadCode } from "../components/Editor";

const EditorPage = () => {
  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const isInitializedRef = useRef(false);

  const [username, setUsername] = useState(
    location.state?.username || localStorage.getItem("username") || ""
  );
  const [clients, setClients] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem("language") || "javascript");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dracula");
  const [code, setCode] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [currentFile, setCurrentFile] = useState({ id: "1", name: "main", language: "javascript" });

  // Stable callback functions
  const handleLanguageChange = useCallback((newLanguage) => {
    if (newLanguage && newLanguage !== language) {
      setLanguage(newLanguage);
      localStorage.setItem("language", newLanguage);
      if (socketRef.current?.connected) {
        socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, { roomId, language: newLanguage });
      }
    }
  }, [roomId, language]);

  const handleThemeChange = useCallback((newTheme) => {
    if (newTheme && newTheme !== theme) {
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      if (socketRef.current?.connected) {
        socketRef.current.emit(ACTIONS.THEME_CHANGE, { roomId, theme: newTheme });
      }
    }
  }, [roomId, theme]);

  const handleFileChange = useCallback((file) => {
    if (file && file.id !== currentFile.id) {
      setCurrentFile(file);
      if (file.language && file.language !== language) {
        handleLanguageChange(file.language);
      }
    }
  }, [currentFile.id, language, handleLanguageChange]);

  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
  }, []);

  // Initialize socket connection - only once
  useEffect(() => {
    if (!username || isInitializedRef.current) {
      return;
    }

    localStorage.setItem("username", username);
    localStorage.setItem("language", language);
    localStorage.setItem("theme", theme);

    const init = async () => {
      try {
        socketRef.current = await initSocket();
        const socket = socketRef.current;

        socket.on("connect", () => {
          console.log("Socket connected:", socket.id);
          setSocketConnected(true);
          isInitializedRef.current = true;

          socket.emit(ACTIONS.JOIN, {
            roomId,
            username,
          });
        });

        socket.on("connect_error", (e) => {
          console.error("Socket connection error:", e);
          toast.error("Socket connection failed, try again later.");
        });

        socket.on("connect_failed", (e) => {
          console.error("Socket connection failed:", e);
          toast.error("Socket connection failed, try again later.");
        });

        socket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
          setSocketConnected(false);
          if (reason === "io server disconnect") {
            // Server disconnected, reconnect manually
            socket.connect();
          }
        });

        socket.on(ACTIONS.JOINED, ({ clients: updatedClients, username: joinedUsername, socketId }) => {
          setClients(updatedClients);
          // Only show toast if it's not the current user joining
          if (joinedUsername && joinedUsername !== username && socketId !== socket.id) {
            toast.success(`${joinedUsername} has joined the room.`);
          }
        });

        socket.on(ACTIONS.DISCONNECTED, ({ socketId, username: leftUsername }) => {
          // Only show toast if it's not the current user
          if (socketId !== socket.id && leftUsername) {
            toast(`${leftUsername} left the room.`);
            setClients((prev) => prev.filter((c) => c.socketId !== socketId));
          }
        });

        socket.on(ACTIONS.LANGUAGE_CHANGE, ({ language: newLanguage }) => {
          if (newLanguage && newLanguage !== language) {
            setLanguage(newLanguage);
            localStorage.setItem("language", newLanguage);
          }
        });

        socket.on(ACTIONS.THEME_CHANGE, ({ theme: newTheme }) => {
          if (newTheme && newTheme !== theme) {
            setTheme(newTheme);
            localStorage.setItem("theme", newTheme);
          }
        });
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        toast.error("Failed to connect to server");
      }
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("connect_error");
        socketRef.current.off("connect_failed");
        socketRef.current.off("disconnect");
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off(ACTIONS.LANGUAGE_CHANGE);
        socketRef.current.off(ACTIONS.THEME_CHANGE);
        // Don't disconnect on cleanup - let it stay connected
      }
    };
  }, [username, roomId]); // Removed navigate and language/theme from deps

  if (!username) {
    return <Navigate to="/" replace />;
  }

  // Get code from editor
  const getEditorCode = useCallback(() => {
    if (editorRef.current && editorRef.current.getValue) {
      return editorRef.current.getValue();
    }
    const editor = document.querySelector(".CodeMirror");
    if (editor && editor.CodeMirror) {
      return editor.CodeMirror.getValue();
    }
    return code || "";
  }, [code]);

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* File Manager Sidebar */}
      <FileManager
        socketRef={socketRef}
        roomId={roomId}
        onFileChange={handleFileChange}
        currentFile={currentFile}
      />

      {/* Main Sidebar */}
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

          {/* Settings */}
          <div className="p-4 border-t border-gray-700 space-y-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Language</label>
              <LanguageSelector
                language={language}
                onLanguageChange={handleLanguageChange}
                socketRef={socketRef}
                roomId={roomId}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Theme</label>
              <ThemeSelector
                theme={theme}
                onThemeChange={handleThemeChange}
                socketRef={socketRef}
                roomId={roomId}
              />
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2 border-t border-gray-700">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded text-white transition duration-200 font-bold text-sm"
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              toast.success("Room ID copied to clipboard!");
            }}
          >
            📋 Copy ROOM ID
          </button>

          <button
            className="w-full bg-green-600 hover:bg-green-700 py-2 px-4 rounded text-white transition duration-200 font-bold text-sm"
            onClick={() => {
              const code = getEditorCode();
              if (code) {
                downloadCode(code, language);
                toast.success("Code downloaded!");
              } else {
                toast.error("No code to download");
              }
            }}
          >
            💾 Download Code
          </button>

          <div className="flex gap-2">
            <button
              className={`flex-1 py-2 px-4 rounded text-white transition duration-200 font-bold text-sm ${
                showChat ? "bg-blue-700" : "bg-gray-600 hover:bg-gray-700"
              }`}
              onClick={() => setShowChat(!showChat)}
            >
              💬 Chat
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded text-white transition duration-200 font-bold text-sm ${
                showOutput ? "bg-green-700" : "bg-gray-600 hover:bg-gray-700"
              }`}
              onClick={() => setShowOutput(!showOutput)}
            >
              ▶️ Run
            </button>
          </div>

          <button
            className="w-full bg-red-600 hover:bg-red-700 py-2 px-4 rounded text-white transition duration-200 font-bold text-sm"
            onClick={() => {
              if (socketRef.current) {
                socketRef.current.disconnect();
              }
              navigate("/", { replace: true });
              localStorage.removeItem("username");
            }}
          >
            🚪 Leave
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">File:</span>
            <span className="text-sm font-semibold text-white">{currentFile.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const code = getEditorCode();
                if (code) {
                  navigator.clipboard.writeText(code);
                  toast.success("Code copied to clipboard!");
                }
              }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
              title="Copy Code"
            >
              📋 Copy
            </button>
            <button
              onClick={() => {
                const editor = document.querySelector(".CodeMirror");
                if (editor && editor.CodeMirror) {
                  editor.CodeMirror.execCommand("find");
                }
              }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
              title="Find (Ctrl+F)"
            >
              🔍 Find
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            ref={editorRef}
            socketRef={socketRef}
            roomId={roomId}
            socketConnected={socketConnected}
            language={language}
            theme={theme}
            onLanguageChange={handleLanguageChange}
            onThemeChange={handleThemeChange}
            onCodeChange={handleCodeChange}
          />
        </div>

        {/* Output Panel */}
        {showOutput && (
          <div className="h-64 border-t border-gray-700">
            <CodeExecutor 
              language={language} 
              getCode={getEditorCode}
            />
          </div>
        )}
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-80 bg-gray-800 border-l border-gray-700">
          <Chat socketRef={socketRef} roomId={roomId} username={username} />
        </div>
      )}
    </div>
  );
};

export default EditorPage;
