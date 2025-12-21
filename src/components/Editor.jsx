// src/components/Editor.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";

/* ✅ ONLY JavaScript mode */
import "codemirror/mode/javascript/javascript";

/* 🎨 Themes */
import "codemirror/theme/dracula.css";
import "codemirror/theme/monokai.css";
import "codemirror/theme/material.css";
import "codemirror/theme/nord.css";

/* ⚙️ Addons */
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/selection/active-line";
import "codemirror/addon/search/search";
import "codemirror/addon/search/searchcursor";
import "codemirror/addon/dialog/dialog";
import "codemirror/addon/dialog/dialog.css";
import "codemirror/addon/comment/comment";

import ACTIONS from "../pages/Actions";
import jsBeautify from "js-beautify";

const Editor = forwardRef(
  ({ socketRef, roomId, socketConnected, theme, onCodeChange }, ref) => {
    const editorRef = useRef(null);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [replaceQuery, setReplaceQuery] = useState("");

    /* expose editor methods */
    useImperativeHandle(ref, () => ({
      getValue: () => editorRef.current?.getValue() || "",
      setValue: (value) => editorRef.current?.setValue(value),
    }));

    /* 🪄 Initialize CodeMirror */
    useEffect(() => {
      if (editorRef.current) return;

      const textarea = document.getElementById("realTimeEditor");
      if (!textarea) return;

      editorRef.current = Codemirror.fromTextArea(textarea, {
        mode: { name: "javascript", json: true },
        theme: theme || "dracula",
        lineNumbers: true,
        lineWrapping: true,
        tabSize: 2,
        indentUnit: 2,
        smartIndent: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        styleActiveLine: true,
        placeholder: "Write JavaScript here...",
      });

      editorRef.current.setSize("100%", "100%");

      editorRef.current.setOption("extraKeys", {
        "Ctrl-F": () => setSearchVisible(true),
        "Ctrl-/": "toggleComment",
        "Ctrl-S": (cm) => downloadCode(cm.getValue()),
        "Ctrl-Alt-L": () => formatCode(),
      });
    }, []);

    /* 🎨 Theme update */
    useEffect(() => {
      if (editorRef.current && theme) {
        editorRef.current.setOption("theme", theme);
      }
    }, [theme]);

    /* 🔁 Socket sync (code only, JS only) */
    useEffect(() => {
      if (!socketConnected || !socketRef.current || !editorRef.current) return;

      const socket = socketRef.current;
      const editor = editorRef.current;

      const onChange = (instance, changeObj) => {
        if (changeObj.origin === "setValue") return;
        const code = instance.getValue();
        socket.emit(ACTIONS.CODE_CHANGE, { roomId, code });
        onCodeChange?.(code);
      };

      const onRemoteCode = ({ code }) => {
        if (code !== editor.getValue()) {
          editor.setValue(code);
        }
      };

      editor.on("change", onChange);
      socket.on(ACTIONS.CODE_CHANGE, onRemoteCode);

      return () => {
        editor.off("change", onChange);
        socket.off(ACTIONS.CODE_CHANGE, onRemoteCode);
      };
    }, [socketConnected, socketRef, roomId, onCodeChange]);

    /* 🔍 Search / Replace */
    const findNext = () => {
      const cm = editorRef.current;
      if (!cm || !searchQuery) return;
      const cursor = cm.getSearchCursor(searchQuery, cm.getCursor());
      if (cursor.findNext()) cm.setSelection(cursor.from(), cursor.to());
    };

    const replaceAll = () => {
      const cm = editorRef.current;
      if (!cm) return;
      cm.setValue(
        cm.getValue().replace(new RegExp(searchQuery, "g"), replaceQuery)
      );
    };

    /* 🧹 JS Formatter */
    const formatCode = () => {
      if (!editorRef.current) return;
      const formatted = jsBeautify.js(editorRef.current.getValue(), {
        indent_size: 2,
      });
      editorRef.current.setValue(formatted);
    };

    return (
      <div className="w-full h-full flex flex-col">
        {searchVisible && (
          <div className="bg-gray-800 p-2 flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 px-2 py-1 bg-gray-700 text-white rounded"
            />
            <input
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace"
              className="flex-1 px-2 py-1 bg-gray-700 text-white rounded"
            />
            <button onClick={findNext}>Find</button>
            <button onClick={replaceAll}>Replace All</button>
            <button onClick={() => setSearchVisible(false)}>✕</button>
          </div>
        )}
        <textarea id="realTimeEditor" />
      </div>
    );
  }
);

Editor.displayName = "Editor";

/* 💾 JS-only download */
const downloadCode = (code) => {
  const blob = new Blob([code], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "code.js";
  a.click();
  URL.revokeObjectURL(url);
};

export default Editor;
