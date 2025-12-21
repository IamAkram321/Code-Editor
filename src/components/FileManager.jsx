import React, { useEffect, useState } from "react";
import { Plus, Trash } from "lucide-react";
import toast from "react-hot-toast";

const FileManager = ({ socketRef, roomId, currentFile, onFileChange }) => {
  const [files, setFiles] = useState([]);
  const [showAddFile, setShowAddFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // ---------------- SOCKET LISTENERS ----------------
  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

    socket.on("file-list", ({ files }) => {
      setFiles(files);
      if (!currentFile && files.length > 0) {
        onFileChange?.(files[0]);
      }
    });

    socket.on("file-added", ({ file }) => {
      setFiles((prev) => [...prev, file]);
    });

    socket.on("file-removed", ({ fileId }) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    });

    return () => {
      socket.off("file-list");
      socket.off("file-added");
      socket.off("file-removed");
    };
  }, [socketRef, roomId]);

  // ---------------- ADD FILE ----------------
  const addFile = () => {
    if (!newFileName.trim()) {
      toast.error("File name required");
      return;
    }

    const newFile = {
      id: Date.now().toString(),
      name: newFileName.trim(),
      language: "javascript", // default
    };

    socketRef.current.emit("add-file", { roomId, file: newFile });

    // 🔥 AUTO OPEN (ChatGPT-style)
    onFileChange?.(newFile);

    setNewFileName("");
    setShowAddFile(false);
  };

  const removeFile = (fileId) => {
    socketRef.current.emit("remove-file", { roomId, fileId });
  };

  return (
    <div className="w-56 bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <span className="text-sm font-semibold text-gray-300">Files</span>
        <button onClick={() => setShowAddFile(true)}>
          <Plus size={16} className="text-gray-400 hover:text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => onFileChange?.(file)}
            className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm
              ${
                currentFile?.id === file.id
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
          >
            <span>{file.name}</span>
            {file.id !== "1" && (
              <Trash
                size={14}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="text-red-400 hover:text-red-500"
              />
            )}
          </div>
        ))}
      </div>

      {/* ADD FILE MODAL */}
      {showAddFile && (
        <div className="p-3 border-t border-gray-700">
          <input
            autoFocus
            type="text"
            placeholder="File name"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFile()}
            className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded outline-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={addFile}
              className="flex-1 bg-blue-600 py-1 rounded text-sm"
            >
              Create
            </button>
            <button
              onClick={() => setShowAddFile(false)}
              className="flex-1 bg-gray-600 py-1 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
