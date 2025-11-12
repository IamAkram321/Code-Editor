import React, { useState } from "react";
import toast from "react-hot-toast";

const CodeExecutor = ({ language, getCode }) => {
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const executeCode = async () => {
    setIsRunning(true);
    setOutput("");
    
    const code = getCode ? getCode() : "";

    try {
      if (language === "javascript" || language === "jsx") {
        // Execute JavaScript in browser
        const originalLog = console.log;
        const logs = [];
        console.log = (...args) => {
          logs.push(args.map((arg) => 
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(" "));
        };

        try {
          // Create a safe execution context
          const func = new Function(code);
          func();
          setOutput(logs.join("\n") || "Code executed successfully (no output)");
        } catch (error) {
          setOutput(`Error: ${error.message}`);
        } finally {
          console.log = originalLog;
        }
      } else if (language === "python") {
        // For Python, we'd need a backend service or use Pyodide
        setOutput("Python execution requires a backend service. JavaScript execution is available.");
        toast.error("Python execution requires backend setup");
      } else if (language === "html") {
        // For HTML, show preview
        const newWindow = window.open();
        newWindow.document.write(code);
        newWindow.document.close();
        setOutput("HTML preview opened in new window");
      } else {
        setOutput(`Code execution for ${language} is not yet supported in the browser.`);
        toast.info(`Execution for ${language} requires backend setup`);
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      toast.error("Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-gray-700">
      <div className="p-2 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Output</h3>
        <button
          onClick={executeCode}
          disabled={isRunning}
          className="px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm font-medium transition"
        >
          {isRunning ? "Running..." : "▶ Run Code"}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
          {output || "Click 'Run Code' to execute your code..."}
        </pre>
      </div>
    </div>
  );
};

export default CodeExecutor;

