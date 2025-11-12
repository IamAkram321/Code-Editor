import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

const FileManager = ({ socketRef, roomId, onFileChange, currentFile }) => {
  const [files, setFiles] = useState([{ id: "1", name: "main", language: "javascript" }]);
  const [showAddFile, setShowAddFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileLanguage, setNewFileLanguage] = useState("javascript");

  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

    const handleFileList = ({ files: fileList }) => {
      if (fileList && Array.isArray(fileList)) {
        setFiles(fileList);
      }
    };

    const handleFileAdded = ({ file }) => {
      if (file) {
        setFiles((prev) => {
          // Check if file already exists
          if (prev.some(f => f.id === file.id)) {
            return prev;
          }
          return [...prev, file];
        });
        toast.success(`File ${file.name} added`);
      }
    };

    const handleFileRemoved = ({ fileId }) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File removed");
    };

    socket.on("file-list", handleFileList);
    socket.on("file-added", handleFileAdded);
    socket.on("file-removed", handleFileRemoved);

    // Request file list on mount only if socket is connected
    if (socket.connected) {
      socket.emit("get-file-list", { roomId });
    } else {
      socket.once("connect", () => {
        socket.emit("get-file-list", { roomId });
      });
    }

    return () => {
      socket.off("file-list", handleFileList);
      socket.off("file-added", handleFileAdded);
      socket.off("file-removed", handleFileRemoved);
    };
  }, [socketRef, roomId]);

  const addFile = () => {
    if (!newFileName.trim()) {
      toast.error("File name is required");
      return;
    }

    if (!socketRef?.current || !socketRef.current.connected) {
      toast.error("Not connected to server. Please wait...");
      return;
    }

    const newFile = {
      id: Date.now().toString(),
      name: newFileName.trim(),
      language: newFileLanguage,
    };

    if (socketRef.current) {
      socketRef.current.emit("add-file", { roomId, file: newFile });
    }

    setNewFileName("");
    setNewFileLanguage("javascript");
    setShowAddFile(false);
  };

  const removeFile = (fileId) => {
    if (files.length === 1) {
      toast.error("Cannot remove the last file");
      return;
    }

    if (!socketRef?.current || !socketRef.current.connected) {
      toast.error("Not connected to server. Please wait...");
      return;
    }

    socketRef.current.emit("remove-file", { roomId, fileId });
  };

  const switchFile = (file) => {
    if (onFileChange && file) {
      onFileChange(file);
    }
  };

  return (
    <div className="bg-gray-800 border-r border-gray-700 w-48 flex flex-col">
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Files</h3>
        <button
          onClick={() => setShowAddFile(!showAddFile)}
          className="text-blue-400 hover:text-blue-300 text-lg font-bold"
          title="Add File"
        >
          +
        </button>
      </div>

      {showAddFile && (
        <div className="p-3 border-b border-gray-700 bg-gray-750 space-y-2">
          <input
            type="text"
            placeholder="File name"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addFile();
              if (e.key === "Escape") {
                setShowAddFile(false);
                setNewFileName("");
              }
            }}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <select
            value={newFileLanguage}
            onChange={(e) => setNewFileLanguage(e.target.value)}
            className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={addFile}
              className="flex-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddFile(false);
                setNewFileName("");
              }}
              className="flex-1 px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className={`p-2 border-b border-gray-700 cursor-pointer hover:bg-gray-700 flex items-center justify-between group ${
              currentFile?.id === file.id ? "bg-gray-700" : ""
            }`}
            onClick={() => switchFile(file)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs text-gray-400">{getFileIcon(file.language)}</span>
              <span className="text-sm text-white truncate">{file.name}</span>
            </div>
            {files.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-sm"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const getFileIcon = (language) => {
  const icons = {
    javascript: "📜",
    python: "🐍",
    html: "🌐",
    css: "🎨",
    typescript: "📘",
    java: "☕",
    cpp: "⚙️",
    default: "📄",
  };
  return icons[language] || icons.default;
};

export default FileManager;
