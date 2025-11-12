import React from "react";
import ACTIONS from "../pages/Actions";

const LanguageSelector = ({ language, onLanguageChange, socketRef, roomId }) => {
  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "c", label: "C" },
    { value: "typescript", label: "TypeScript" },
    { value: "jsx", label: "JSX" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "php", label: "PHP" },
    { value: "ruby", label: "Ruby" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "sql", label: "SQL" },
    { value: "markdown", label: "Markdown" },
    { value: "yaml", label: "YAML" },
    { value: "json", label: "JSON" },
  ];

  const handleChange = (e) => {
    const newLanguage = e.target.value;
    if (newLanguage && newLanguage !== language) {
      onLanguageChange(newLanguage);
      if (socketRef?.current?.connected) {
        socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, { roomId, language: newLanguage });
      }
    }
  };

  return (
    <select
      value={language}
      onChange={handleChange}
      className="px-3 py-1.5 bg-gray-700 text-white rounded border border-gray-600 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
    >
      {languages.map((lang) => (
        <option key={lang.value} value={lang.value}>
          {lang.label}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;
