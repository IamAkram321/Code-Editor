// src/components/Editor.jsx
import React, { useEffect, useRef } from "react";
import Codemirror from "codemirror";
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/foldcode";
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/addon/selection/active-line";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/edit/closebrackets";
import ACTIONS from "../pages/Actions";

const Editor = ({ socketRef, roomId, socketConnected }) => {
  const editorRef = useRef(null);

  // Initialize CodeMirror once
  useEffect(() => {
    if (!editorRef.current) {
      const textarea = document.getElementById("realTimeEditor");
      editorRef.current = Codemirror.fromTextArea(textarea, {
        mode: { name: "javascript", json: true },
        theme: "dracula",
        lineNumbers: true,
        lineWrapping: true,
        tabSize: 2,
        indentUnit: 2,
        smartIndent: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        styleActiveLine: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        foldGutter: true,
        autoCloseTags: true,
      });

      
      editorRef.current.setSize("100%", "100%");
    }
  }, []);

  // Attaching and detaching socket listeners when socket becomes available
  useEffect(() => {
    if (!socketConnected || !socketRef.current || !editorRef.current) return;

    const socket = socketRef.current;

    // When local user types, emit code changes (avoid emitting when setValue is used)

    const onChangeHandler = (instance, changeObj) => {
      const origin = changeObj.origin;
      const code = instance.getValue();

      // avoid broadcasting when we programmatically set the value
      if (origin !== "setValue") {
        socket.emit(ACTIONS.CODE_CHANGE, { roomId, code });
      }
    };

    // When remote code change arrives, update editor only if different

    const onCodeChange = ({ code }) => {
      if (code == null || !editorRef.current) return;
      const current = editorRef.current.getValue();

      if (current !== code) {
        editorRef.current.setValue(code);
      }

    };

    // Bind listeners
    editorRef.current.on("change", onChangeHandler);
    socket.on(ACTIONS.CODE_CHANGE, onCodeChange);

    // cleanup
    return () => {
      if (editorRef.current) editorRef.current.off("change", onChangeHandler);
      if (socket) socket.off(ACTIONS.CODE_CHANGE, onCodeChange);
    };
  }, [socketConnected, socketRef, roomId]);

  return (
    <div className="w-full h-full">
      <textarea id="realTimeEditor" />
    </div>
  );
};

export default Editor;
