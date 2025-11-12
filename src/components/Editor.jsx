// src/components/Editor.jsx
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";

// 🧩 Language modes (CodeMirror v5)
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/mode/clike/clike"; // For Java, C, C++
import "codemirror/mode/xml/xml";
import "codemirror/mode/css/css";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/jsx/jsx";
import "codemirror/mode/php/php";
import "codemirror/mode/ruby/ruby";
import "codemirror/mode/go/go";
import "codemirror/mode/rust/rust";
import "codemirror/mode/sql/sql";
import "codemirror/mode/markdown/markdown";
import "codemirror/mode/yaml/yaml";

// 🎨 Themes
import "codemirror/theme/dracula.css";
import "codemirror/theme/monokai.css";
import "codemirror/theme/material.css";
import "codemirror/theme/nord.css";
import "codemirror/theme/solarized.css";
import "codemirror/theme/tomorrow-night-bright.css";

// ⚙️ Addons
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/foldcode";
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/addon/selection/active-line";
import "codemirror/addon/search/search";
import "codemirror/addon/search/searchcursor";
import "codemirror/addon/search/jump-to-line";
import "codemirror/addon/dialog/dialog";
import "codemirror/addon/dialog/dialog.css";
import "codemirror/addon/display/placeholder";
import "codemirror/addon/comment/comment";

import ACTIONS from "../pages/Actions";
import jsBeautify from "js-beautify";

const Editor = forwardRef(({
  socketRef,
  roomId,
  socketConnected,
  language,
  theme,
  onLanguageChange,
  onThemeChange,
  onCodeChange,
}, ref) => {
  const editorRef = useRef(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const searchStateRef = useRef(null);
  const lastLanguageRef = useRef(language);
  const lastThemeRef = useRef(theme);

  const languageModes = {
    javascript: { name: "javascript", json: true },
    python: "python",
    java: "text/x-java",
    cpp: "text/x-c++src",
    c: "text/x-csrc",
    html: "htmlmixed",
    css: "css",
    typescript: "text/typescript",
    jsx: "jsx",
    php: "php",
    ruby: "ruby",
    go: "go",
    rust: "rust",
    sql: "sql",
    markdown: "markdown",
    yaml: "yaml",
    json: { name: "javascript", json: true },
  };

  // Expose editor methods via ref
  useImperativeHandle(ref, () => ({
    getValue: () => editorRef.current?.getValue() || "",
    setValue: (value) => {
      if (editorRef.current) {
        editorRef.current.setValue(value);
      }
    },
  }));

  // 🪄 Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current) {
      const textarea = document.getElementById("realTimeEditor");
      if (!textarea) return;
      
      editorRef.current = Codemirror.fromTextArea(textarea, {
        mode: languageModes[language] || languageModes.javascript,
        theme: theme || "dracula",
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
        placeholder: "Start coding...",
      });

      editorRef.current.setSize("100%", "100%");

      // Keyboard Shortcuts
      editorRef.current.setOption("extraKeys", {
        "Ctrl-F": () => {
          setSearchVisible(true);
          setTimeout(() => {
            const searchInput = document.querySelector(".CodeMirror-dialog input");
            if (searchInput) searchInput.focus();
          }, 100);
        },
        "Ctrl-H": () => {
          setSearchVisible(true);
          setTimeout(() => {
            const searchInput = document.querySelector(".CodeMirror-dialog input");
            if (searchInput) searchInput.focus();
          }, 100);
        },
        "Ctrl-/": "toggleComment",
        "Shift-Tab": "indentLess",
        "Ctrl-S": (cm) => {
          const code = cm.getValue();
          downloadCode(code, language);
        },
        "Ctrl-Alt-L": () => formatCode(), // Format shortcut
      });
    }
  }, []); // Only run once

  // 🧩 Language update - prevent circular updates
  useEffect(() => {
    if (editorRef.current && language && language !== lastLanguageRef.current) {
      lastLanguageRef.current = language;
      const mode = languageModes[language] || languageModes.javascript;
      editorRef.current.setOption("mode", mode);
    }
  }, [language]);

  // 🎨 Theme update - prevent circular updates
  useEffect(() => {
    if (editorRef.current && theme && theme !== lastThemeRef.current) {
      lastThemeRef.current = theme;
      editorRef.current.setOption("theme", theme);
    }
  }, [theme]);

  // 🔁 Socket listeners
  useEffect(() => {
    if (!socketConnected || !socketRef.current || !editorRef.current) return;

    const socket = socketRef.current;
    const editor = editorRef.current;

    const onChangeHandler = (instance, changeObj) => {
      const origin = changeObj.origin;
      const code = instance.getValue();
      const cursor = instance.getCursor();

      if (origin !== "setValue" && origin !== "remote") {
        socket.emit(ACTIONS.CODE_CHANGE, { roomId, code });
        socket.emit(ACTIONS.CURSOR_CHANGE, {
          roomId,
          cursor: { line: cursor.line, ch: cursor.ch },
          socketId: socket.id,
        });
        if (onCodeChange) onCodeChange(code);
      }
    };

    const onCodeChange = ({ code }) => {
      if (!editorRef.current || code == null) return;
      const current = editorRef.current.getValue();
      if (current !== code) {
        // Mark as remote to prevent circular updates
        editorRef.current.setValue(code);
      }
    };

    const onCursorChange = ({ cursor, socketId }) => {
      if (socketId === socket.id) return;
      // (You can add collaborative cursor highlighting here)
    };

    editor.on("change", onChangeHandler);
    editor.on("cursorActivity", () => {
      const cursor = editor.getCursor();
      socket.emit(ACTIONS.CURSOR_CHANGE, {
        roomId,
        cursor: { line: cursor.line, ch: cursor.ch },
        socketId: socket.id,
      });
    });

    socket.on(ACTIONS.CODE_CHANGE, onCodeChange);
    socket.on(ACTIONS.CURSOR_CHANGE, onCursorChange);
    
    // Only update if different to prevent circular updates
    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ language: newLang }) => {
      if (newLang && newLang !== language && onLanguageChange) {
        onLanguageChange(newLang);
      }
    });
    
    socket.on(ACTIONS.THEME_CHANGE, ({ theme: newTheme }) => {
      if (newTheme && newTheme !== theme && onThemeChange) {
        onThemeChange(newTheme);
      }
    });

    return () => {
      editor.off("change", onChangeHandler);
      editor.off("cursorActivity");
      socket.off(ACTIONS.CODE_CHANGE, onCodeChange);
      socket.off(ACTIONS.CURSOR_CHANGE, onCursorChange);
      socket.off(ACTIONS.LANGUAGE_CHANGE);
      socket.off(ACTIONS.THEME_CHANGE);
    };
  }, [socketConnected, socketRef, roomId, language, theme, onLanguageChange, onThemeChange, onCodeChange]);

  // 🔍 Search + Replace
  const performSearch = (query, replace = null) => {
    if (!editorRef.current || !query) return;
    const editor = editorRef.current;
    const cursor = editor.getSearchCursor(query, editor.getCursor());

    if (cursor.findNext()) {
      editor.setSelection(cursor.from(), cursor.to());
      editor.scrollIntoView(cursor.from(), 20);
      searchStateRef.current = cursor;
    } else {
      const newCursor = editor.getSearchCursor(query, { line: 0, ch: 0 });
      if (newCursor.findNext()) {
        editor.setSelection(newCursor.from(), newCursor.to());
        editor.scrollIntoView(newCursor.from(), 20);
        searchStateRef.current = newCursor;
      }
    }

    if (replace && searchStateRef.current) {
      searchStateRef.current.replace(replace);
    }
  };

  const replaceAll = () => {
    if (!editorRef.current || !searchQuery || !replaceQuery) return;
    const editor = editorRef.current;
    const code = editor.getValue();
    const newCode = code.replace(new RegExp(searchQuery, "g"), replaceQuery);
    editor.setValue(newCode);
  };

  // 🧹 Code Formatter
  const formatCode = () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    let formatted;

    try {
      if (["javascript", "json", "jsx"].includes(language)) {
        formatted = jsBeautify.js(code, { indent_size: 2, space_in_empty_paren: true });
      } else if (language === "html") {
        formatted = jsBeautify.html(code, { indent_size: 2 });
      } else if (language === "css") {
        formatted = jsBeautify.css(code, { indent_size: 2 });
      } else {
        formatted = code;
      }
      editorRef.current.setValue(formatted);
    } catch (err) {
      console.error("Error formatting code:", err);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {searchVisible && (
        <div className="bg-gray-800 p-2 border-b border-gray-700 flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") performSearch(searchQuery);
              if (e.key === "Escape") setSearchVisible(false);
            }}
            className="flex-1 px-3 py-1 bg-gray-700 text-white rounded"
          />
          <input
            type="text"
            placeholder="Replace..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            className="flex-1 px-3 py-1 bg-gray-700 text-white rounded"
          />
          <button onClick={() => performSearch(searchQuery)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
            Find
          </button>
          <button onClick={() => performSearch(searchQuery, replaceQuery)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
            Replace
          </button>
          <button onClick={replaceAll} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
            Replace All
          </button>
          <button onClick={() => setSearchVisible(false)} className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700">
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 w-full h-full">
        <textarea id="realTimeEditor" />
      </div>
    </div>
  );
});

Editor.displayName = "Editor";

// 💾 Download code utility
const downloadCode = (code, language) => {
  const extensionMap = {
    javascript: "js",
    python: "py",
    java: "java",
    cpp: "cpp",
    c: "c",
    html: "html",
    css: "css",
    typescript: "ts",
    jsx: "jsx",
    php: "php",
    ruby: "rb",
    go: "go",
    rust: "rs",
    sql: "sql",
    markdown: "md",
    yaml: "yml",
    json: "json",
  };

  const ext = extensionMap[language] || "txt";
  const blob = new Blob([code], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `code.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
};

export default Editor;
export { downloadCode };
