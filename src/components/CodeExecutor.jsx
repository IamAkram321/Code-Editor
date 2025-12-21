import React, { useState } from "react";

const CodeExecutor = ({ getCode }) => {
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const runCode = () => {
    setOutput("");
    setError("");

    const code = getCode();
    if (!code) return;

    try {
      const logs = [];
      const originalLog = console.log;

      console.log = (...args) => {
        logs.push(args.join(" "));
      };

      new Function(code)(); // JS execution

      console.log = originalLog;
      setOutput(logs.join("\n") || "✔ Code executed successfully");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="h-full bg-black text-green-400 p-3 font-mono text-sm overflow-auto">
      <button
        className="mb-2 px-3 py-1 bg-green-600 text-black rounded"
        onClick={runCode}
      >
        ▶ Run JavaScript
      </button>

      {output && <pre>{output}</pre>}
      {error && <pre className="text-red-400">{error}</pre>}
    </div>
  );
};

export default CodeExecutor;
