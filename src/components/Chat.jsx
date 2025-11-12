import React, { useState, useEffect, useRef } from "react";

const Chat = ({ socketRef, roomId, username }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

    const handleMessage = ({ username: sender, message: msg, timestamp }) => {
      setMessages((prev) => [...prev, { username: sender, message: msg, timestamp }]);
    };

    socket.on("chat-message", handleMessage);

    return () => {
      socket.off("chat-message", handleMessage);
    };
  }, [socketRef]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !socketRef?.current) return;

    const timestamp = new Date().toLocaleTimeString();
    socketRef.current.emit("chat-message", {
      roomId,
      username,
      message: message.trim(),
      timestamp,
    });

    setMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 border-t border-gray-700">
      <div className="p-2 border-b border-gray-700 bg-gray-750">
        <h3 className="text-sm font-semibold text-white">Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, idx) => (
          <div key={idx} className="text-sm">
            <span className="font-semibold text-blue-400">{msg.username}:</span>
            <span className="text-gray-300 ml-2">{msg.message}</span>
            <span className="text-xs text-gray-500 ml-2">{msg.timestamp}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-2 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
